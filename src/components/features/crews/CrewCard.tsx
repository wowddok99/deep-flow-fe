"use client"

import { Users, Globe, Lock } from 'lucide-react'
import type { CrewSummary } from '@/lib/api'

interface CrewCardProps {
  crew: CrewSummary
  onClick?: () => void
}

export function CrewCard({ crew, onClick }: CrewCardProps) {
  const memberLabel = crew.maxMembers
    ? `${crew.memberCount}/${crew.maxMembers}`
    : `${crew.memberCount}`
  const isPublic = crew.visibility === 'PUBLIC'
  const VisibilityIcon = isPublic ? Globe : Lock

  return (
    <div
      className="flex flex-col gap-3 p-4 rounded-xl border border-border bg-card hover:border-border/80 hover:bg-muted/30 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="min-w-0">
        <h3 className="text-sm font-semibold truncate">{crew.name}</h3>
        {crew.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{crew.description}</p>
        )}
      </div>

      <div className="mt-auto flex items-center gap-2 text-[10px] text-muted-foreground tabular-nums">
        <span className="flex items-center gap-1">
          <VisibilityIcon className="h-3 w-3" />
          {isPublic ? '공개' : '비공개'}
        </span>
        <span className="text-muted-foreground/40">·</span>
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {memberLabel}
        </span>
        <span className="text-muted-foreground/40">·</span>
        <span className="flex items-center gap-1 text-green-500">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          지금 {crew.activeNowCount}명 집중 중
        </span>
      </div>
    </div>
  )
}
