"use client"

import * as React from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Search } from 'lucide-react'
import {
  CrewDetailHeader,
  CrewMemberList,
  CrewActivityCard,
} from '@/components/features/crews'
import { useCrewDetail } from '@/hooks/useCrews'
import { getApiErrorCode } from '@/lib/axios'
import { crewErrorMessage } from '@/components/features/crews'
import { LivePresenceStrip } from '@/components/features/feed/LivePresenceStrip'
import { AdaptiveHighlightCard } from '@/components/features/highlights/AdaptiveHighlightCard'
import { CrewFeedList } from '@/components/features/feed/CrewFeedList'
import { cn } from '@/lib/utils'

type Tab = 'feed' | 'activity'

export default function CrewDetailPage() {
  const params = useParams<{ crewId: string }>()
  const search = useSearchParams()
  const router = useRouter()
  const crewId = Number(params.crewId)
  const { data, isLoading, error } = useCrewDetail(Number.isFinite(crewId) ? crewId : null)

  const initialTab: Tab = search.get('tab') === 'activity' ? 'activity' : 'feed'
  const [tab, setTab] = React.useState<Tab>(initialTab)

  // 탭 변경 시 URL 동기화 (스크롤 위치 보존)
  React.useEffect(() => {
    const url = new URL(window.location.href)
    if (tab === 'feed') url.searchParams.delete('tab')
    else url.searchParams.set('tab', tab)
    window.history.replaceState({}, '', url.toString())
  }, [tab])

  if (error) {
    const code = getApiErrorCode(error)
    const msg = crewErrorMessage(code) ?? '크루 정보를 불러오지 못했어요'
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full gap-3">
        <p className="text-sm text-muted-foreground">{msg}</p>
        <Button variant="outline" size="sm" onClick={() => router.push('/app/crews')}>
          목록으로
        </Button>
      </div>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-20 rounded-xl border border-border bg-card animate-pulse" />
        <div className="h-40 rounded-xl border border-border bg-card animate-pulse" />
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-5 max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/app/crews')}
            className="gap-1.5 cursor-pointer -ml-2 text-muted-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            목록으로
          </Button>

          <Link
            href={`/app/crews/${crewId}/search`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground rounded-md px-2 py-1 hover:bg-secondary/50 transition-colors"
          >
            <Search className="h-3 w-3" /> 검색
          </Link>
        </div>

        <CrewDetailHeader crew={data} />

        {/* 탭 토글 */}
        <div className="flex items-center gap-1 border-b border-border">
          {([
            ['feed', '피드'],
            ['activity', '활동'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer -mb-px',
                tab === key
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 탭 내용 */}
        {tab === 'feed' && (
          <div className="space-y-4">
            <LivePresenceStrip crewId={data.id} />
            <AdaptiveHighlightCard crewId={data.id} />
            <CrewFeedList crewId={data.id} />
          </div>
        )}

        {tab === 'activity' && (
          <CrewActivityCard crewId={data.id} />
        )}

        <CrewMemberList crew={data} />
      </div>
    </ScrollArea>
  )
}
