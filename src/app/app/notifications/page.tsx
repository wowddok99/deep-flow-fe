"use client"

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useInView } from 'react-intersection-observer'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { notificationApi, notificationKeys } from '@/lib/api'
import { useNotificationStore } from '@/store/useNotificationStore'
import { NotificationItem } from '@/components/features/notifications/NotificationItem'

export default function NotificationsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const markAllReadInStore = useNotificationStore((s) => s.markAllRead)
  const unreadCount = useNotificationStore((s) => s.unreadCount)

  const { ref: loadMoreRef, inView } = useInView()

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [...notificationKeys.unread, 'page'],
    queryFn: ({ pageParam }) => notificationApi.unread(pageParam, 20),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.hasNext ? (lastPage.nextCursorId ?? undefined) : undefined,
  })

  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  const readAllMutation = useMutation({
    mutationFn: () => notificationApi.readAll(),
    onMutate: () => markAllReadInStore(),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread })
      queryClient.invalidateQueries({ queryKey: [...notificationKeys.unread, 'page'] })
    },
  })

  const allItems = React.useMemo(
    () => data?.pages.flatMap((p) => p.content) ?? [],
    [data]
  )

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-1.5 cursor-pointer -ml-2 text-muted-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            뒤로
          </Button>
          <h1 className="text-lg font-bold ml-2">알림</h1>
          {unreadCount > 0 && (
            <span className="text-xs text-red-500 dark:text-red-400 font-bold ml-1">
              ({unreadCount})
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs cursor-pointer"
            onClick={() => readAllMutation.mutate()}
            disabled={readAllMutation.isPending}
          >
            모두 읽음으로 표시
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-px pb-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoading && allItems.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-12">
              아직 받은 알림이 없어요
            </div>
          )}

          {allItems.map((item) => (
            <NotificationItem
              key={item.id}
              item={item}
              variant="page"
            />
          ))}

          {hasNextPage && (
            <div ref={loadMoreRef} className="flex justify-center py-4">
              {isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
