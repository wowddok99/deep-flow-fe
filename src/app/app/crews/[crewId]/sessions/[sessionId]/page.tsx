"use client"

import * as React from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Pencil, Share2, Clock, Trash2 } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  feedApi, feedKeys, shareApi,
  api as sessionsApi,
} from '@/lib/api'
import { getApiErrorCode, getApiErrorMessage } from '@/lib/axios'
import { useAuthStore } from '@/store/useAuthStore'
import { ReadOnlyContent } from '@/components/features/editor/ReadOnlyContent'
import { ReactionBar } from '@/components/features/reactions/ReactionBar'
import { CommentThread } from '@/components/features/comments/CommentThread'
import { SessionDetailSheet } from '@/components/features/editor/SessionDetailSheet'

const ERROR_CARRIES: Record<string, string> = {
  NOT_CREW_MEMBER: '이 크루의 멤버가 아니에요',
  SESSION_NOT_IN_CREW: '이 크루에 공유된 세션이 아니에요',
  SESSION_NOT_FOUND: '세션을 찾을 수 없어요',
}

export default function SharedSessionPage() {
  const params = useParams<{ crewId: string; sessionId: string }>()
  const search = useSearchParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const myId = useAuthStore((s) => s.user?.id)

  const crewId = Number(params.crewId)
  const sessionId = Number(params.sessionId)
  const highlightCommentId = Number(search.get('commentId')) || null

  // 피드 단건 (헤더 메타용)
  const {
    data: feedItem,
    isLoading: feedLoading,
    error: feedError,
  } = useQuery({
    queryKey: feedKeys.detail(crewId, sessionId),
    queryFn: () => feedApi.detail(crewId, sessionId),
    enabled: Number.isFinite(crewId) && Number.isFinite(sessionId),
    staleTime: 30 * 1000,
  })

  // 본문 (Tiptap content) — 작성자 본인일 때만 받을 수 있음 (sessions/{id} 는 본인 소유 검사)
  const isAuthor = myId != null && feedItem?.user.id === myId
  const { data: detail } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => sessionsApi.sessions.get(sessionId),
    enabled: isAuthor,
    staleTime: 30 * 1000,
  })

  const [editSheetOpen, setEditSheetOpen] = React.useState(false)
  const [unshareDialogOpen, setUnshareDialogOpen] = React.useState(false)

  const unshareMutation = useMutation({
    mutationFn: () => shareApi.unshare(sessionId),
    onSuccess: () => {
      toast.success('공유를 철회했어요')
      queryClient.invalidateQueries({ queryKey: feedKeys.list(crewId) })
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      router.push(`/app/crews/${crewId}`)
    },
    onError: (e) => {
      toast.error(getApiErrorMessage(e, '공유 철회에 실패했어요'))
    },
  })

  if (feedError) {
    const code = getApiErrorCode(feedError)
    const msg = (code && ERROR_CARRIES[code]) ?? '세션을 불러올 수 없어요'
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full gap-3">
        <p className="text-sm text-muted-foreground">{msg}</p>
        <Button variant="outline" size="sm" onClick={() => router.push(`/app/crews/${crewId}`)}>
          크루로 돌아가기
        </Button>
      </div>
    )
  }

  if (feedLoading || !feedItem) {
    return (
      <div className="p-6 space-y-3">
        <div className="h-12 rounded-xl border border-border bg-card animate-pulse" />
        <div className="h-48 rounded-xl border border-border bg-card animate-pulse" />
        <div className="h-24 rounded-xl border border-border bg-card animate-pulse" />
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
        {/* 뒤로 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/app/crews/${crewId}`)}
          className="gap-1.5 cursor-pointer -ml-2 text-muted-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          크루로
        </Button>

        {/* 헤더 */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold">{feedItem.title ?? '(제목 없음)'}</h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1.5">
                <span>{feedItem.user.name}</span>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {formatDuration(feedItem.durationSeconds)}
                </span>
                <span>·</span>
                <span>{new Date(feedItem.sharedAt).toLocaleString()}</span>
                {feedItem.edited && (
                  <span className="inline-flex items-center gap-0.5 text-muted-foreground/70">
                    <Pencil className="h-2.5 w-2.5" /> 편집됨
                  </span>
                )}
              </div>
            </div>

            {isAuthor && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer h-8 text-xs gap-1"
                  onClick={() => setEditSheetOpen(true)}
                >
                  <Pencil className="h-3 w-3" /> 편집
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer h-8 text-xs gap-1 text-destructive hover:text-destructive"
                  onClick={() => setUnshareDialogOpen(true)}
                >
                  <Trash2 className="h-3 w-3" /> 공유 철회
                </Button>
              </div>
            )}
          </div>

          {/* 태그 */}
          {feedItem.tags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {feedItem.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-secondary/60 text-secondary-foreground text-xs px-2 py-0.5"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 본문 */}
        <div className="rounded-xl border border-border bg-card py-2">
          {isAuthor && detail?.content ? (
            <ReadOnlyContent content={detail.content} />
          ) : feedItem.summaryPreview ? (
            <div className="px-4 py-4">
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{feedItem.summaryPreview}</p>
              {!isAuthor && (
                <p className="text-[11px] text-muted-foreground/70 italic mt-2">
                  요약 미리보기입니다. (본문 전체는 작성자만 볼 수 있어요)
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic px-4 py-4">본문이 비어있어요</p>
          )}
        </div>

        {/* 리액션 */}
        <ReactionBar sessionId={sessionId} />

        {/* 댓글 */}
        <CommentThread
          sessionId={sessionId}
          crewId={crewId}
          highlightCommentId={highlightCommentId}
        />
      </div>

      {/* 작성자 편집 시트 */}
      {editSheetOpen && isAuthor && (
        <SessionDetailSheet
          sessionId={sessionId}
          onClose={() => {
            setEditSheetOpen(false)
            // 본문 변경 후 피드 invalidate
            queryClient.invalidateQueries({ queryKey: feedKeys.detail(crewId, sessionId) })
          }}
        />
      )}

      {/* 공유 철회 확인 */}
      <AlertDialog open={unshareDialogOpen} onOpenChange={setUnshareDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>공유 철회할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              공유를 내리면 댓글과 리액션도 함께 사라져요. 복원할 수 없어요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => unshareMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              철회
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ScrollArea>
  )
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h === 0) return `${m}분`
  if (m === 0) return `${h}시간`
  return `${h}시간 ${m}분`
}
