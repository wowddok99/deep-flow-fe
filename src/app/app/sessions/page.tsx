"use client"

import * as React from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type SessionSummary } from '@/lib/api'
import { SessionCard } from '@/components/features/sessions/SessionCard'
import { SessionDetailSheet } from '@/components/features/editor/SessionDetailSheet'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, Loader2 } from 'lucide-react'
import { useInView } from 'react-intersection-observer'

type SortType = 'latest' | 'oldest' | 'duration'
type PeriodType = 'all' | 'today' | 'week' | 'month'

const PERIOD_LABELS: Record<PeriodType, string> = {
  all: '전체',
  today: '오늘',
  week: '이번 주',
  month: '이번 달',
}

function getStartOfPeriod(period: PeriodType): Date | null {
  const now = new Date()
  switch (period) {
    case 'today':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate())
    case 'week': {
      const day = now.getDay()
      const diff = day === 0 ? 6 : day - 1
      const start = new Date(now)
      start.setDate(now.getDate() - diff)
      start.setHours(0, 0, 0, 0)
      return start
    }
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1)
    default:
      return null
  }
}

export default function SessionsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = React.useState('')
  const [sort, setSort] = React.useState<SortType>('latest')
  const [period, setPeriod] = React.useState<PeriodType>('all')
  const [selectedSessionId, setSelectedSessionId] = React.useState<number | null>(null)

  const { ref: loadMoreRef, inView } = useInView()

  const {
    data: sessions,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['sessions', 'list'],
    queryFn: ({ pageParam }) => api.sessions.list(pageParam, 20),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.hasNext ? lastPage.nextCursorId : undefined,
  })

  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.sessions.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })

  const allSessions = React.useMemo(() => {
    const items = sessions?.pages.flatMap(p => p.content) ?? []

    // 기간 필터
    const periodStart = getStartOfPeriod(period)
    let filtered = periodStart
      ? items.filter(s => new Date(s.startTime) >= periodStart)
      : items

    // 검색 필터
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      filtered = filtered.filter(s =>
        (s.title?.toLowerCase().includes(q)) ||
        (s.summary?.toLowerCase().includes(q))
      )
    }

    // 정렬
    const sorted = [...filtered]
    switch (sort) {
      case 'oldest':
        sorted.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        break
      case 'duration':
        sorted.sort((a, b) => b.durationSeconds - a.durationSeconds)
        break
      default: // latest
        sorted.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    }

    return sorted
  }, [sessions, search, sort, period])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">세션</h1>
          <span className="text-xs text-muted-foreground">
            {allSessions.length}개
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="세션 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex gap-1 flex-wrap">
            {(Object.keys(PERIOD_LABELS) as PeriodType[]).map((p) => (
              <Button
                key={p}
                variant={period === p ? 'secondary' : 'ghost'}
                size="sm"
                className="text-xs h-7 cursor-pointer"
                onClick={() => setPeriod(p)}
              >
                {PERIOD_LABELS[p]}
              </Button>
            ))}
          </div>
          <div className="flex gap-1 flex-wrap">
            {([
              ['latest', '최신순'],
              ['oldest', '오래된순'],
              ['duration', '시간순'],
            ] as const).map(([key, label]) => (
              <Button
                key={key}
                variant={sort === key ? 'secondary' : 'ghost'}
                size="sm"
                className="text-xs h-7 cursor-pointer"
                onClick={() => setSort(key)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Session List */}
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-1 pb-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoading && allSessions.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-12">
              {search ? '검색 결과가 없습니다' : '세션이 없습니다'}
            </div>
          )}

          {allSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onClick={() => setSelectedSessionId(session.id)}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}

          {/* Infinite scroll trigger */}
          {hasNextPage && (
            <div ref={loadMoreRef} className="flex justify-center py-4">
              {isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
          )}
        </div>
      </ScrollArea>

      <SessionDetailSheet
        sessionId={selectedSessionId}
        onClose={() => setSelectedSessionId(null)}
      />
    </div>
  )
}
