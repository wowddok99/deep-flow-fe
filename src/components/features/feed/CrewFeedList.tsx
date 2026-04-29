"use client"

import * as React from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useInView } from 'react-intersection-observer'
import { Loader2 } from 'lucide-react'
import { feedApi, feedKeys, tagApi, tagKeys } from '@/lib/api'
import { CrewFeedItemCard } from './CrewFeedItemCard'
import { cn } from '@/lib/utils'

interface CrewFeedListProps {
  crewId: number
}

export function CrewFeedList({ crewId }: CrewFeedListProps) {
  const [tag, setTag] = React.useState<string | null>(null)
  const { ref: loadMoreRef, inView } = useInView()

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: feedKeys.list(crewId, tag ?? undefined),
    queryFn: ({ pageParam }) => feedApi.list(crewId, pageParam, 20, tag ?? undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.hasNext ? (last.nextCursor ?? undefined) : undefined),
  })

  const { data: popularTags = [] } = useQuery({
    queryKey: tagKeys.popular(crewId),
    queryFn: () => tagApi.popular(crewId, 5),
    staleTime: 5 * 60 * 1000,
  })

  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  const items = data?.pages.flatMap((p) => p.content) ?? []

  return (
    <div className="space-y-3">
      {/* 태그 필터 칩 */}
      {popularTags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setTag(null)}
            className={cn(
              'rounded-full px-2.5 py-0.5 text-xs cursor-pointer transition-colors',
              tag === null ? 'bg-foreground text-background' : 'bg-secondary/60 hover:bg-secondary text-secondary-foreground'
            )}
          >
            전체
          </button>
          {popularTags.map((t) => (
            <button
              key={t.tag}
              onClick={() => setTag(t.tag)}
              className={cn(
                'rounded-full px-2.5 py-0.5 text-xs cursor-pointer transition-colors',
                tag === t.tag ? 'bg-foreground text-background' : 'bg-secondary/60 hover:bg-secondary text-secondary-foreground'
              )}
            >
              #{t.tag}
            </button>
          ))}
        </div>
      )}

      {/* 피드 */}
      {isLoading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {tag
            ? `#${tag} 태그가 달린 공유 세션이 없어요`
            : '아직 공유된 세션이 없어요. 첫 글을 남겨보세요!'}
        </div>
      )}

      <div className="space-y-2">
        {items.map((it) => (
          <CrewFeedItemCard key={it.sessionId} item={it} crewId={crewId} />
        ))}
      </div>

      {hasNextPage && (
        <div ref={loadMoreRef} className="flex justify-center py-3">
          {isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
      )}
    </div>
  )
}
