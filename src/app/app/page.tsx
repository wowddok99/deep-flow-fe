"use client"

import { Timer } from "@/components/features/timer/Timer"
import { RecentSessions } from "@/components/features/sessions/RecentSessions"

export default function Home() {
  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col items-center justify-center relative min-w-0 overflow-hidden">
        <Timer />
      </div>
      <RecentSessions />
    </div>
  )
}
