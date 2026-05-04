"use client"

import type { CrewDetail } from '@/lib/api'
import { CrewMemberRow } from './CrewMemberRow'

interface Props {
  crew: CrewDetail
}

export function CrewMemberList({ crew }: Props) {
  const canKick = crew.myRole === 'OWNER'

  return (
    <div className="space-y-1">
      <h2 className="text-sm font-semibold mb-2">멤버 ({crew.memberCount})</h2>
      <div className="rounded-xl border border-border divide-y divide-border/50 overflow-hidden">
        {crew.members.map((m) => (
          <CrewMemberRow key={m.userId} member={m} crewId={crew.id} canKick={canKick} />
        ))}
      </div>
    </div>
  )
}
