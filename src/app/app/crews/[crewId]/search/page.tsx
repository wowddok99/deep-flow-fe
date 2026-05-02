"use client"

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useInView } from 'react-intersection-observer'
import { ArrowLeft, Search, Loader2 } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { searchApi, searchKeys, type SearchType } from '@/lib/api'
import { getApiErrorCode } from '@/lib/axios'
import { SearchResultCard } from '@/components/features/search/SearchResultCard'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 20

export default function CrewSearchPage() {
  const params = useParams<{ crewId: string }>()
  const router = useRouter()
  const crewId = Number(params.crewId)

  const [input, setInput] = React.useState('')
  const [debounced, setDebounced] = React.useState('')
  const [type, setType] = React.useState<SearchType>('session')

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(input.trim()), 300)
    return () => clearTimeout(t)
  }, [input])

  const tooShort = debounced.length > 0 && debounced.length < 2
  const enabled = !tooShort && debounced.length >= 2 && Number.isFinite(crewId)

  const { ref: loadMoreRef, inView } = useInView()

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: searchKeys.inCrew(crewId, debounced, type),
    queryFn: ({ pageParam = 0 }) => searchApi.inCrew(crewId, debounced, type, pageParam, PAGE_SIZE),
    enabled,
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasNext ? last.offset + last.size : undefined),
  })

  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  const items = data?.pages.flatMap((p) => p.items) ?? []
  const totalShown = items.length
  const errorCode = isError ? getApiErrorCode(error) : null

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="px-6 pt-6 pb-4 space-y-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/app/crews/${crewId}`)}
            className="gap-1.5 cursor-pointer -ml-2 text-muted-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> 크루로
          </Button>
          <h1 className="text-lg font-bold ml-2">크루 검색</h1>
        </div>

        {/* 검색 입력 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="검색어 입력... (2글자 이상)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* type 토글 */}
        <div className="flex gap-1.5">
          {(['session', 'tag'] as const).map((t) => (
            <Button
              key={t}
              variant={type === t ? 'secondary' : 'ghost'}
              size="sm"
              className="text-xs h-7 cursor-pointer"
              onClick={() => setType(t)}
            >
              {t === 'session' ? '세션' : '태그'}
            </Button>
          ))}
        </div>

        {tooShort && (
          <p className="text-xs text-muted-foreground">2글자 이상 입력해주세요</p>
        )}
        {errorCode === 'SEARCH_QUERY_TOO_SHORT' && (
          <p className="text-xs text-destructive">검색어가 너무 짧아요</p>
        )}
      </div>

      {/* 결과 */}
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-2 pb-6">
          {enabled && (
            <p className="text-[11px] text-muted-foreground px-1 mb-1">
              {isLoading ? '검색 중...' : `결과 ${totalShown}건`}
            </p>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoading && enabled && items.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              검색 결과가 없어요. 다른 키워드로 시도해 보세요
            </div>
          )}

          {items.map((r) => (
            <SearchResultCard key={r.sessionId} result={r} query={debounced} crewId={crewId} />
          ))}

          {hasNextPage && (
            <div ref={loadMoreRef} className="flex justify-center py-3">
              {isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
