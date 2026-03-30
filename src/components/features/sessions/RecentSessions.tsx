"use client"

import * as React from 'react'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/lib/api'
import { useTimerStore } from '@/store/timer-store'
import { useNavStore } from '@/store/useNavStore'
import { SessionCard } from './SessionCard'
import { SessionDetailSheet } from '@/components/features/editor/SessionDetailSheet'
import { SessionEditorSheet } from '@/components/features/editor/SessionEditorSheet'
import { ChevronRight, ChevronLeft } from 'lucide-react'

export function RecentSessions() {
  const isRunning = useTimerStore((s) => s.isRunning)
  const { isRightCollapsed, toggleRightCollapse } = useNavStore()
  const queryClient = useQueryClient()
  const [selectedSessionId, setSelectedSessionId] = React.useState<number | null>(null)
  const [autoCollapsed, setAutoCollapsed] = React.useState(false)

  // 창 너비 1024px 미만이면 자동 접기
  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 1024px)')
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      setAutoCollapsed(e.matches)
    }
    handler(mq)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const effectiveCollapsed = autoCollapsed || isRightCollapsed

  const { data: sessions } = useQuery({
    queryKey: ['sessions', 'recent'],
    queryFn: () => api.sessions.list(undefined, 5),
    refetchOnWindowFocus: true,
  })

  const prevRunning = React.useRef(isRunning)
  React.useEffect(() => {
    if (prevRunning.current !== isRunning) {
      const delay = prevRunning.current && !isRunning ? 500 : 0
      const t = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['sessions'] })
      }, delay)
      prevRunning.current = isRunning
      return () => clearTimeout(t)
    }
  }, [isRunning, queryClient])

  const recentSessions = sessions?.content.filter(s => s.status !== 'ONGOING').slice(0, 5) ?? []

  return (
    <div className="relative flex-shrink-0 h-full flex">
      {/* 토글 — 호버 시 화살표 표시 */}
      <button
        onClick={toggleRightCollapse}
        className="w-4 h-full flex-shrink-0 group relative cursor-pointer flex items-center justify-center"
      >
        <div className="absolute inset-0 bg-transparent group-hover:bg-muted/50 transition-colors" />
        <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
          {isRightCollapsed ? <ChevronLeft className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {/* 사이드바 본체 */}
      <motion.aside
        animate={{ width: effectiveCollapsed ? 0 : 280 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="border-l border-border h-full flex flex-col overflow-hidden"
      >
        {!effectiveCollapsed && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <span className="text-xs text-muted-foreground font-medium">세션</span>
              <Link
                href="/app/sessions"
                className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                더보기
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Session List */}
            <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
              {/* Active Session — 리스트 최상단 */}
              <AnimatePresence>
                {isRunning && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-medium text-primary uppercase tracking-wider">Active</span>
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">You are in flow.</p>
                      <SessionEditorSheet />
                    </div>
                    <div className="mx-2 mt-2 h-px bg-border/50" />
                  </motion.div>
                )}
              </AnimatePresence>

              {recentSessions.length === 0 && !isRunning ? (
                <div className="text-xs text-muted-foreground text-center py-8">세션이 없습니다</div>
              ) : (
                recentSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onClick={() => setSelectedSessionId(session.id)}
                    compact
                  />
                ))
              )}
            </div>
          </>
        )}
      </motion.aside>

      <SessionDetailSheet
        sessionId={selectedSessionId}
        onClose={() => setSelectedSessionId(null)}
      />
    </div>
  )
}
