"use client"

import * as React from 'react'
import Link from 'next/link'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Bell } from 'lucide-react'
import { useNotificationStore } from '@/store/useNotificationStore'
import { notificationApi, notificationKeys } from '@/lib/api'
import { NotificationItem } from './NotificationItem'
import { cn } from '@/lib/utils'

interface NotificationPopoverProps {
  collapsed?: boolean   // 사이드바 접힘 상태에서 툴팁만 표시
}

const POPOVER_LIMIT = 10

export function NotificationPopover({ collapsed = false }: NotificationPopoverProps) {
  const [open, setOpen] = React.useState(false)
  const items = useNotificationStore((s) => s.items)
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const markAllRead = useNotificationStore((s) => s.markAllRead)
  const queryClient = useQueryClient()

  const readAllMutation = useMutation({
    mutationFn: () => notificationApi.readAll(),
    onMutate: () => markAllRead(),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread })
    },
  })

  const visible = items.slice(0, POPOVER_LIMIT)
  const hasUnread = unreadCount > 0

  const trigger = (
    <button
      type="button"
      className={cn(
        'relative flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors cursor-pointer',
      )}
      aria-label={`알림${hasUnread ? ` (${unreadCount}개 안 읽음)` : ''}`}
    >
      <Bell className="h-4 w-4" />
      {hasUnread && (
        <span
          className={cn(
            'absolute top-0.5 right-0.5 min-w-[14px] h-[14px] px-1 rounded-full',
            'bg-red-500 dark:bg-red-400 text-[9px] font-bold text-white',
            'flex items-center justify-center'
          )}
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  )

  const wrappedTrigger = collapsed ? (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>알림</TooltipContent>
    </Tooltip>
  ) : (
    <PopoverTrigger asChild>{trigger}</PopoverTrigger>
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {wrappedTrigger}
      <PopoverContent
        side="right"
        align="end"
        sideOffset={12}
        className="w-80 p-0"
      >
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <span className="text-sm font-semibold">알림 {hasUnread && <span className="text-red-500 dark:text-red-400 font-bold">({unreadCount})</span>}</span>
          {hasUnread && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs cursor-pointer"
              onClick={() => readAllMutation.mutate()}
            >
              모두 읽음
            </Button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {visible.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">
              아직 받은 알림이 없어요
            </div>
          ) : (
            <div className="py-1">
              {visible.map((item) => (
                <NotificationItem
                  key={item.id}
                  item={item}
                  onClickAfter={() => setOpen(false)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border">
          <Link
            href="/app/notifications"
            onClick={() => setOpen(false)}
            className="block w-full px-3 py-2 text-center text-xs text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-colors"
          >
            전체 알림 보기 →
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
