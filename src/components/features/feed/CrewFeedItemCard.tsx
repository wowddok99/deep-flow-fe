"use client"

import * as React from 'react'
import Link from 'next/link'
import { MessageCircle, Clock, Pencil } from 'lucide-react'
import type { CrewFeedItem } from '@/lib/api'
import { cn } from '@/lib/utils'

interface CrewFeedItemCardProps {
  item: CrewFeedItem
  crewId: number
}

export function CrewFeedItemCard({ item, crewId }: CrewFeedItemCardProps) {
  return (
    <Link
      href={`/app/crews/${crewId}/sessions/${item.sessionId}`}
      className="block rounded-xl border border-border bg-card hover:border-foreground/20 hover:bg-card/80 transition-colors p-4"
    >
      {/* 작성자 + 시각 + 길이 */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
        <span className="font-medium text-foreground">{item.user.name}</span>
        <span>·</span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" /> {formatDuration(item.durationSeconds)}
        </span>
        <span>·</span>
        <span>{relativeTime(item.sharedAt)}</span>
        {item.edited && (
          <span className="inline-flex items-center gap-0.5 ml-1 text-muted-foreground/70">
            <Pencil className="h-2.5 w-2.5" /> 편집됨
          </span>
        )}
      </div>

      {/* 제목 */}
      <h3 className="text-sm font-semibold mb-1 line-clamp-1">
        📝 {item.title ?? '(제목 없음)'}
      </h3>

      {/* 본문 미리보기 */}
      {item.summaryPreview && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-relaxed">
          {item.summaryPreview}
        </p>
      )}

      {/* 태그 + 메트릭 */}
      <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
        <div className="flex items-center gap-1 flex-wrap">
          {item.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-secondary/60 text-secondary-foreground text-[10px] px-1.5 py-px"
            >
              #{t}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="h-3 w-3" /> {item.commentCount}
          </span>
          <span className="inline-flex items-center gap-1">
            🔥 {item.reactionCount}
          </span>
        </div>
      </div>
    </Link>
  )
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h === 0) return `${m}분`
  if (m === 0) return `${h}시간`
  return `${h}시간 ${m}분`
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
