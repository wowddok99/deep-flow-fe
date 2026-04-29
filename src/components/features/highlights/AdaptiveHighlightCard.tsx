"use client"

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { highlightApi, highlightKeys, type CrewHighlight, type HighlightItem } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Flame, Clock, Hash, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdaptiveHighlightCardProps {
  crewId: number
}

export function AdaptiveHighlightCard({ crewId }: AdaptiveHighlightCardProps) {
  const { data, isLoading } = useQuery({
    queryKey: highlightKeys.byCrew(crewId),
    queryFn: () => highlightApi.get(crewId),
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) {
    return <div className="h-28 rounded-xl border border-border bg-card animate-pulse" />
  }
  if (!data) return null

  if (data.mode === 'EMPTY') return <HighlightEmpty />
  if (data.mode === 'GROWING') return <HighlightGrowing data={data} crewId={crewId} />
  return <HighlightMature data={data} crewId={crewId} />
}

function HighlightEmpty() {
  const router = useRouter()
  return (
    <div className="rounded-xl border border-border bg-card p-5 text-center space-y-2">
      <Sparkles className="h-5 w-5 mx-auto text-muted-foreground" />
      <p className="text-sm font-medium">첫 발자국</p>
      <p className="text-xs text-muted-foreground">
        아직 공유된 세션이 없어요. 우리 크루의 첫 발자국을 남겨보세요!
      </p>
      <Button
        size="sm"
        variant="outline"
        className="cursor-pointer mt-2"
        onClick={() => router.push('/app/sessions')}
      >
        내 세션 공유하러 가기
      </Button>
    </div>
  )
}

function HighlightGrowing({ data, crewId }: { data: CrewHighlight; crewId: number }) {
  const progress = Math.min(1, data.recentSharedCount / Math.max(1, data.threshold))
  const recentItems = data.items.filter((it) => it.type === 'RECENT')
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground">우리 크루의 최근 활약</p>
        <span className="text-[10px] text-muted-foreground">
          {data.recentSharedCount} / {data.threshold}
        </span>
      </div>

      <div className="space-y-1.5">
        {recentItems.slice(0, 3).map((it) => (
          <HighlightLink key={`${it.type}-${it.sessionId}`} item={it} crewId={crewId} />
        ))}
      </div>

      <div className="space-y-1">
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full bg-foreground transition-all"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground">
          조금만 더 모이면 정식 하이라이트가 열려요!
        </p>
      </div>
    </div>
  )
}

function HighlightMature({ data, crewId }: { data: CrewHighlight; crewId: number }) {
  const hot = data.items.find((it) => it.type === 'HOT')
  const long = data.items.find((it) => it.type === 'LONG')
  const tags = data.items.filter((it) => it.type === 'TAG')

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2.5">
      <p className="text-xs font-semibold text-muted-foreground">이번 주 하이라이트</p>

      {hot && (
        <Row icon={<Flame className="h-3.5 w-3.5 text-orange-500" />} label="가장 뜨거운 글">
          <Link
            href={hot.sessionId ? `/app/crews/${crewId}/sessions/${hot.sessionId}` : '#'}
            className="text-sm hover:underline truncate block"
          >
            {hot.userName} — {hot.title} <span className="text-orange-500/80 text-xs ml-1">(🔥 {Math.round(hot.score ?? 0)})</span>
          </Link>
        </Row>
      )}

      {long && (
        <Row icon={<Clock className="h-3.5 w-3.5 text-blue-500" />} label="가장 긴 집중">
          <Link
            href={long.sessionId ? `/app/crews/${crewId}/sessions/${long.sessionId}` : '#'}
            className="text-sm hover:underline truncate block"
          >
            {long.userName} — {long.title} <span className="text-blue-500/80 text-xs ml-1">({formatDuration(long.durationSeconds ?? 0)})</span>
          </Link>
        </Row>
      )}

      {tags.length > 0 && (
        <Row icon={<Hash className="h-3.5 w-3.5 text-purple-500" />} label="핫한 태그">
          <div className="flex items-center gap-1.5 flex-wrap">
            {tags.map((t) => (
              <span key={t.tag} className="rounded-full bg-secondary text-secondary-foreground text-xs px-2 py-0.5">
                #{t.tag}
              </span>
            ))}
          </div>
        </Row>
      )}
    </div>
  )
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <div className="flex items-center gap-1.5 w-28 flex-shrink-0 pt-0.5">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}

function HighlightLink({ item, crewId }: { item: HighlightItem; crewId: number }) {
  if (!item.sessionId) return null
  return (
    <Link
      href={`/app/crews/${crewId}/sessions/${item.sessionId}`}
      className="flex items-center gap-2 text-xs hover:bg-secondary/40 rounded px-1.5 py-1 transition-colors"
    >
      <span className="font-medium">{item.userName}</span>
      <span className="text-muted-foreground truncate flex-1">{item.title}</span>
    </Link>
  )
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}
