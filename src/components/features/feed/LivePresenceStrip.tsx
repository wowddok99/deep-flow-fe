"use client"

import * as React from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { presenceApi, presenceKeys, type ActiveMember } from '@/lib/api'

interface LivePresenceStripProps {
  crewId: number
}

export function LivePresenceStrip({ crewId }: LivePresenceStripProps) {
  const { data, isLoading } = useQuery({
    queryKey: presenceKeys.live(crewId),
    queryFn: () => presenceApi.live(crewId),
    refetchInterval: 30 * 1000,
    staleTime: 10 * 1000,
  })

  const [, setTick] = React.useState(0)
  React.useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card animate-pulse h-12" />
    )
  }

  const members = data?.activeMembers ?? []
  if (members.length === 0) return null

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-border bg-card">
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <span className="text-xs font-medium">지금 집중 중</span>
      </div>

      <div className="flex items-center -space-x-2">
        {members.slice(0, 6).map((m, i) => (
          <PulseAvatar key={m.userId} member={m} index={i} />
        ))}
        {members.length > 6 && (
          <span className="ml-3 text-[11px] text-muted-foreground">
            +{members.length - 6}
          </span>
        )}
      </div>

      <span className="text-xs text-muted-foreground ml-2 truncate">
        {members[0].name}님이 {minutesSince(members[0].sessionStartedAt)}째 열공 중
      </span>
    </div>
  )
}

function PulseAvatar({ member, index }: { member: ActiveMember; index: number }) {
  const initial = member.name.slice(0, 1).toUpperCase()
  return (
    <motion.div
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.06, 1] }}
      transition={{
        duration: 1.4,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: index * 0.18,
      }}
      title={`${member.name} · ${minutesSince(member.sessionStartedAt)}째`}
      className="relative h-7 w-7 rounded-full bg-secondary ring-2 ring-green-400/60 ring-offset-1 ring-offset-card flex items-center justify-center text-xs font-semibold cursor-default"
    >
      {initial}
    </motion.div>
  )
}

function minutesSince(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  const m = Math.floor(diff / 60)
  if (m < 1) return '방금'
  if (m < 60) return `${m}분`
  const h = Math.floor(m / 60)
  const rest = m % 60
  if (rest === 0) return `${h}시간`
  return `${h}시간 ${rest}분`
}
