"use client"

import { Users } from 'lucide-react'
import type { CrewSummary } from '@/lib/api'

interface CrewCardProps {
  crew: CrewSummary
  onClick?: () => void
}

export function CrewCard({ crew, onClick }: CrewCardProps) {
  const memberLabel = crew.maxMembers
    ? `${crew.memberCount}/${crew.maxMembers}`
    : `${crew.memberCount}`

  return (
    <div
      className="relative flex flex-col gap-3 p-4 rounded-xl border border-border bg-card hover:border-border/80 hover:bg-muted/30 transition-colors cursor-pointer"
      onClick={onClick}
    >
      {crew.visibility === 'PUBLIC' && (
        <span className="absolute top-2 left-2 text-[9px] font-medium bg-primary/10 text-primary rounded-full px-1.5 py-0.5">
          공개
        </span>
      )}

      <div className="flex items-start justify-between pt-3">
        <div className="min-w-0 flex-1 pr-2">
          <h3 className="text-sm font-semibold truncate">{crew.name}</h3>
          {crew.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{crew.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1 text-muted-foreground bg-muted rounded-full px-2 py-0.5 flex-shrink-0">
          <Users className="h-3 w-3" />
          <span className="text-[10px] font-medium">{memberLabel}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 text-[10px] text-green-500">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          지금 {crew.activeNowCount}명 집중 중
        </span>
      </div>
    </div>
  )
}
