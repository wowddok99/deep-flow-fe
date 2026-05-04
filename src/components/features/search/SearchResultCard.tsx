"use client"

import * as React from 'react'
import Link from 'next/link'
import { Clock } from 'lucide-react'
import type { SearchResult } from '@/lib/api'

interface SearchResultCardProps {
  result: SearchResult
  query: string
  crewId: number
}

export function SearchResultCard({ result, query, crewId }: SearchResultCardProps) {
  return (
    <Link
      href={`/app/crews/${crewId}/sessions/${result.sessionId}`}
      className="block rounded-xl border border-border bg-card hover:border-foreground/20 hover:bg-card/80 transition-colors p-4"
    >
      <h3 className="text-sm font-semibold mb-1">
        {highlightMatch(result.title ?? '(제목 없음)', query)}
      </h3>
      <p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-relaxed">
        {highlightMatch(result.summaryPreview ?? '', query)}
      </p>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>{result.user.name}</span>
          <span>·</span>
          <span>{new Date(result.sharedAt).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {result.tags.slice(0, 3).map((t) => (
            <span
              key={t}
              className="rounded-md bg-muted/50 text-muted-foreground text-[10px] px-2 py-0.5"
            >
              #{t}
            </span>
          ))}
        </div>
      </div>
    </Link>
  )
}

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text
  const q = query.trim()
  const idx = text.toLowerCase().indexOf(q.toLowerCase())
  if (idx < 0) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 dark:bg-yellow-700/40 text-foreground px-0.5 rounded-sm">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  )
}
