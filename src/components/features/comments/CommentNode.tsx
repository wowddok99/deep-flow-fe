"use client"

import * as React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Pencil, Trash2, MessageSquare, Loader2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { commentApi, commentKeys, type CommentNode as CommentNodeData } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/axios'
import { useAuthStore } from '@/store/useAuthStore'
import { CommentInput } from './CommentInput'
import { cn } from '@/lib/utils'

interface CommentNodeViewProps {
  node: CommentNodeData
  sessionId: number
  crewId: number
  highlightCommentId?: number | null
  depth?: number                         // 0 = top level, 1+ = reply
}

export function CommentNodeView({
  node,
  sessionId,
  crewId,
  highlightCommentId,
  depth = 0,
}: CommentNodeViewProps) {
  const queryClient = useQueryClient()
  const myId = useAuthStore((s) => s.user?.id)
  const isMine = myId != null && node.user.id === myId

  const [editing, setEditing] = React.useState(false)
  const [editContent, setEditContent] = React.useState(node.content)
  const [replyOpen, setReplyOpen] = React.useState(false)

  const isHighlighted = highlightCommentId === node.id
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (isHighlighted && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [isHighlighted])

  const updateMutation = useMutation({
    mutationFn: () => commentApi.update(node.id, { content: editContent.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.list(sessionId) })
      setEditing(false)
    },
    onError: (e) => toast.error(getApiErrorMessage(e, '수정에 실패했어요')),
  })

  const deleteMutation = useMutation({
    mutationFn: () => commentApi.delete(node.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.list(sessionId) })
    },
    onError: (e) => toast.error(getApiErrorMessage(e, '삭제에 실패했어요')),
  })

  return (
    <div
      ref={ref}
      className={cn(
        'rounded-lg transition-colors',
        depth > 0 && 'ml-6 border-l border-border/50 pl-3',
        isHighlighted && 'bg-yellow-100 dark:bg-yellow-900/20 px-2 py-1 -mx-2'
      )}
    >
      <div className="flex items-baseline justify-between gap-2 mb-0.5">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold">{node.user.name}</span>
          <span className="text-[10px] text-muted-foreground">{relativeTime(node.createdAt)}</span>
          {node.edited && !node.deleted && (
            <span className="text-[10px] text-muted-foreground">(편집됨)</span>
          )}
        </div>
        {isMine && !node.deleted && !editing && (
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => { setEditContent(node.content); setEditing(true) }}
              className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"
              aria-label="수정"
            >
              <Pencil className="h-3 w-3" />
            </button>
            <button
              onClick={() => {
                if (confirm('이 댓글을 삭제할까요?')) deleteMutation.mutate()
              }}
              className="text-muted-foreground hover:text-destructive p-1 cursor-pointer"
              aria-label="삭제"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {/* 본문 */}
      {node.deleted ? (
        <p className="text-sm text-muted-foreground italic">삭제된 댓글입니다</p>
      ) : editing ? (
        <div className="space-y-1.5">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={2}
            className="resize-none"
          />
          <div className="flex items-center gap-1.5 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)} className="cursor-pointer">
              취소
            </Button>
            <Button
              size="sm"
              onClick={() => updateMutation.mutate()}
              disabled={!editContent.trim() || updateMutation.isPending}
              className="cursor-pointer"
            >
              {updateMutation.isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
              저장
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm whitespace-pre-wrap break-words">{node.content}</p>
      )}

      {/* 답글 트리거 (top-level 만) */}
      {!node.deleted && !editing && depth === 0 && (
        <div className="mt-1.5">
          <button
            onClick={() => setReplyOpen((o) => !o)}
            className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 cursor-pointer"
          >
            <MessageSquare className="h-3 w-3" /> 답글
          </button>
        </div>
      )}

      {replyOpen && (
        <div className="mt-2 pl-3 border-l border-border/50">
          <CommentInput
            sessionId={sessionId}
            crewId={crewId}
            parentId={node.id}
            placeholder="답글 작성..."
            autoFocus
            onSubmitted={() => setReplyOpen(false)}
            onCancel={() => setReplyOpen(false)}
          />
        </div>
      )}

      {/* 답글들 */}
      {node.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {node.replies.map((r) => (
            <CommentNodeView
              key={r.id}
              node={r}
              sessionId={sessionId}
              crewId={crewId}
              highlightCommentId={highlightCommentId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function relativeTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return '방금'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}일 전`
  return new Date(iso).toLocaleDateString()
}
