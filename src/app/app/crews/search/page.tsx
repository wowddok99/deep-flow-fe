"use client"

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Search } from 'lucide-react'
import { CrewCard } from '@/components/features/crews'
import { crewToastMessage } from '@/components/features/crews'
import { useCrewSearch } from '@/hooks/useCrews'
import { useJoinPublic } from '@/hooks/useCrewMutations'
import type { CrewSummary } from '@/lib/api'

function useDebounced<T>(value: T, delay = 300): T {
  const [v, setV] = React.useState(value)
  React.useEffect(() => {
    const t = setTimeout(() => setV(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return v
}

export default function CrewSearchPage() {
  const router = useRouter()
  const [q, setQ] = React.useState('')
  const debouncedQ = useDebounced(q, 300)

  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } = useCrewSearch(debouncedQ)
  const joinPublic = useJoinPublic()

  const results: CrewSummary[] = data?.pages.flatMap((p) => p.content) ?? []

  const handleJoin = async (crew: CrewSummary) => {
    if (crew.role) {
      router.push(`/app/crews/${crew.id}`)
      return
    }
    try {
      await joinPublic.mutateAsync(crew.id)
      toast.success(`${crew.name} 에 참여했어요`)
      router.push(`/app/crews/${crew.id}`)
    } catch (err) {
      toast.error(crewToastMessage(err, '참여에 실패했습니다'))
    }
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/app/crews')}
          className="gap-1.5 cursor-pointer -ml-2 text-muted-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          내 크루로
        </Button>

        <h1 className="text-lg font-bold">공개 크루 둘러보기</h1>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="크루 이름/설명으로 검색"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {debouncedQ.length === 0 ? (
          <p className="text-sm text-muted-foreground">검색어를 입력하세요</p>
        ) : isFetching && results.length === 0 ? (
          <p className="text-sm text-muted-foreground">검색 중...</p>
        ) : results.length === 0 ? (
          <p className="text-sm text-muted-foreground">검색 결과가 없어요</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {results.map((c) => (
                <div key={c.id} className="space-y-2">
                  <CrewCard crew={c} onClick={() => router.push(`/app/crews/${c.id}`)} />
                  <Button
                    size="sm"
                    variant={c.role ? 'outline' : 'default'}
                    className="w-full cursor-pointer"
                    disabled={joinPublic.isPending}
                    onClick={() => handleJoin(c)}
                  >
                    {c.role ? '이동' : '참여'}
                  </Button>
                </div>
              ))}
            </div>
            {hasNextPage && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="cursor-pointer"
                >
                  {isFetchingNextPage ? '로딩 중...' : '더 보기'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </ScrollArea>
  )
}
