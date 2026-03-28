"use client"

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GRADE_COLORS, gradeStars } from '@/lib/achievement'
import { Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AchievementNotification {
  code: string
  name: string
  description: string
  grade: number
  type: 'achieved' | 'preview' // achieved: 세션 종료 후, preview: 진행 중 선행 알림
}

interface AchievementToastProps {
  notifications: AchievementNotification[]
  onDismiss: (code: string) => void
}

export function AchievementToast({ notifications, onDismiss }: AchievementToastProps) {
  React.useEffect(() => {
    if (notifications.length === 0) return

    const current = notifications[0]
    const timer = setTimeout(() => {
      onDismiss(current.code)
    }, 5000)

    return () => clearTimeout(timer)
  }, [notifications, onDismiss])

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
      <AnimatePresence>
        {notifications.slice(0, 1).map((n) => (
          <motion.div
            key={n.code}
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="pointer-events-auto"
          >
            <div className={cn(
              'flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-2xl backdrop-blur-md',
              n.type === 'achieved'
                ? 'bg-background/90 border-amber-400/30'
                : 'bg-background/90 border-blue-400/30'
            )}>
              <div className={cn(
                'flex items-center justify-center h-10 w-10 rounded-full flex-shrink-0',
                n.type === 'achieved' ? 'bg-amber-400/20' : 'bg-blue-400/20'
              )}>
                <Trophy className={cn(
                  'h-5 w-5',
                  n.type === 'achieved' ? 'text-amber-400' : 'text-blue-400'
                )} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  {n.type === 'achieved' ? '새로운 칭호를 달성했습니다!' : '칭호 달성 조건 충족!'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={cn('text-xs', GRADE_COLORS[n.grade])}>
                    {gradeStars(n.grade)}
                  </span>
                  <span className="text-sm font-semibold text-foreground">{n.name}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{n.description}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
