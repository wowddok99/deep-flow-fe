"use client"

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationApi, notificationKeys, type NotificationItem as NotificationItemType } from '@/lib/api'
import { useNotificationStore } from '@/store/useNotificationStore'
import { cn } from '@/lib/utils'
import { MessageCircle } from 'lucide-react'

interface NotificationItemProps {
  item: NotificationItemType
  onClickAfter?: () => void   // popover 자동 닫힘 등
  variant?: 'popover' | 'page'
}

export function NotificationItem({ item, onClickAfter, variant = 'popover' }: NotificationItemProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const markRead = useNotificationStore((s) => s.markRead)

  const readMutation = useMutation({
    mutationFn: (id: number) => notificationApi.read(id),
    onMutate: (id) => {
      markRead(id)  // 낙관적
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread })
    },
  })

  const handleClick = () => {
    if (!item.read) {
      // 양수 id 만 서버에 호출 (SSE 임시 음수 id 는 동기화 후 처리)
      if (item.id > 0) readMutation.mutate(item.id)
      else markRead(item.id)
    }

    // deep link 이동 (crewId/sessionId 가 있을 때만)
    if (item.crewId && item.sessionId) {
      // commentId 가 양수일 때만 highlight query 추가 — SSE 임시 음수 / NaN 방어.
      const query = item.commentId && item.commentId > 0
        ? `?commentId=${item.commentId}&highlight=true`
        : ''
      router.push(`/app/crews/${item.crewId}/sessions/${item.sessionId}${query}`)
    }
    onClickAfter?.()
  }

  const canNavigate = !!(item.crewId && item.sessionId)

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!canNavigate}
      className={cn(
        'w-full text-left px-3 py-2.5 transition-colors flex items-start gap-2.5 cursor-pointer',
        'hover:bg-secondary/60',
        !item.read && 'bg-secondary/30',
        !canNavigate && 'opacity-60 cursor-not-allowed',
        variant === 'page' && 'px-4 py-3.5'
      )}
    >
      <div className="flex-shrink-0 mt-0.5 relative">
        <MessageCircle className="h-4 w-4 text-muted-foreground" />
        {!item.read && (
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-red-500 dark:bg-red-400 rounded-full" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-medium truncate">
            {item.actorName ?? '누군가'}님이 {commentTypeLabel(item)}
          </span>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
            {relativeTime(item.createdAt)}
          </span>
        </div>
        {item.contentPreview && (
          <p className={cn(
            'text-xs text-muted-foreground mt-0.5',
            variant === 'popover' ? 'line-clamp-1' : 'line-clamp-2'
          )}>
            {item.contentPreview}
          </p>
        )}
        {!canNavigate && (
          <p className="text-[10px] text-muted-foreground/60 mt-0.5 italic">
            (공유가 철회되었거나 댓글이 삭제되어 이동할 수 없어요)
          </p>
        )}
      </div>
    </button>
  )
}

function commentTypeLabel(item: NotificationItemType): string {
  // SSE 페이로드의 type 필드는 NotificationItem 에 안 담음 — 단순화 (멘션/내 글 댓글 통합 표시)
  return '댓글'
}

function relativeTime(iso: string): string {
  const now = Date.now()
  const t = new Date(iso).getTime()
  const diff = (now - t) / 1000
  if (diff < 60) return '방금'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}일 전`
  return new Date(iso).toLocaleDateString()
}
