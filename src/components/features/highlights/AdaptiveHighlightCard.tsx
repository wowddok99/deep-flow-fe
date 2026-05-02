"use client"

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { highlightApi, highlightKeys, type CrewHighlight, type HighlightItem } from '@/lib/api'
import { formatDuration } from '@/lib/formatDuration'
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
        <span className="text-[10px] text-muted-foreground tabular-nums">
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
          <HighlightTitle crewId={crewId} sessionId={hot.sessionId} title={hot.title}>
            <span className="inline-flex items-center gap-0.5 ml-2 text-orange-500/80 text-xs align-middle tabular-nums">
              <Flame className="h-3 w-3" /> {Math.round(hot.score ?? 0)}
            </span>
          </HighlightTitle>
        </Row>
      )}

      {long && (
        <Row icon={<Clock className="h-3.5 w-3.5 text-blue-500" />} label="가장 긴 집중">
          <HighlightTitle crewId={crewId} sessionId={long.sessionId} title={long.title}>
            <span className="inline-flex items-center gap-0.5 ml-2 text-blue-500/80 text-xs align-middle tabular-nums">
              <Clock className="h-3 w-3" /> {formatDuration(long.durationSeconds ?? 0)}
            </span>
          </HighlightTitle>
        </Row>
      )}

      {tags.length > 0 && (
        <Row icon={<Hash className="h-3.5 w-3.5 text-purple-500" />} label="핫한 태그">
          <div className="flex items-center gap-1.5 flex-wrap">
            {tags.map((t) => (
              <span key={t.tag} className="rounded-md bg-muted/50 text-muted-foreground text-xs px-2 py-0.5">
                #{t.tag}
              </span>
            ))}
          </div>
        </Row>
      )}
    </div>
  )
}

// 세션이 삭제됐거나 공유 철회된 경우 sessionId 가 null 로 응답에 남을 수 있음.
// 이 때 클릭 시 dead-end (페이지 새로고침만) 가 일어나지 않도록 Link 대신 비활성 span 으로 렌더.
function HighlightTitle({
  crewId,
  sessionId,
  title,
  children,
}: {
  crewId: number
  sessionId: number | null | undefined
  title: string | undefined
  children: React.ReactNode
}) {
  if (!sessionId) {
    return (
      <span className="text-sm text-muted-foreground/60 italic truncate block">
        {title ?? '(삭제된 세션)'}
        {children}
      </span>
    )
  }
  return (
    <Link
      href={`/app/crews/${crewId}/sessions/${sessionId}`}
      className="text-sm hover:underline truncate block"
    >
      {title}
      {children}
    </Link>
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

