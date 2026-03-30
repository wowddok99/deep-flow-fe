"use client"

import { Users } from 'lucide-react'

interface GroupCardProps {
  group: {
    id: number
    name: string
    description: string
    memberCount: number
    todayActive: number
  }
  onClick?: () => void
}

export function GroupCard({ group, onClick }: GroupCardProps) {
  return (
    <div
      className="flex flex-col gap-3 p-4 rounded-xl border border-border bg-card hover:border-border/80 hover:bg-muted/30 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold">{group.name}</h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{group.description}</p>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground bg-muted rounded-full px-2 py-0.5">
          <Users className="h-3 w-3" />
          <span className="text-[10px] font-medium">{group.memberCount}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 text-[10px] text-green-500">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          오늘 {group.todayActive}명 활동
        </span>
      </div>
    </div>
  )
}
