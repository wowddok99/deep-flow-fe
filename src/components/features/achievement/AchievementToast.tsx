"use client"

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GRADE_COLORS, gradeStars } from '@/lib/achievement'
import { Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from 'next-themes'

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

const GRADE_BORDER_COLORS: Record<number, string> = {
  1: 'border-zinc-400/40 dark:border-zinc-400/20',
  2: 'border-green-400/40 dark:border-green-400/20',
  3: 'border-blue-400/40 dark:border-blue-400/20',
  4: 'border-purple-400/40 dark:border-purple-400/20',
  5: 'border-amber-400/40 dark:border-amber-400/20',
}

const GRADE_LINE_COLORS_LIGHT: Record<number, [string, string]> = {
  1: ['rgba(161,161,170,0.8)', 'rgba(161,161,170,0)'],
  2: ['rgba(74,222,128,0.8)', 'rgba(74,222,128,0)'],
  3: ['rgba(96,165,250,0.8)', 'rgba(96,165,250,0)'],
  4: ['rgba(192,132,252,0.8)', 'rgba(192,132,252,0)'],
  5: ['rgba(251,191,36,0.8)', 'rgba(251,191,36,0)'],
}

const GRADE_LINE_COLORS_DARK: Record<number, [string, string]> = {
  1: ['rgba(161,161,170,0.6)', 'rgba(161,161,170,0)'],
  2: ['rgba(74,222,128,0.6)', 'rgba(74,222,128,0)'],
  3: ['rgba(96,165,250,0.6)', 'rgba(96,165,250,0)'],
  4: ['rgba(192,132,252,0.6)', 'rgba(192,132,252,0)'],
  5: ['rgba(251,191,36,0.6)', 'rgba(251,191,36,0)'],
}

const GRADE_ICON_BG: Record<number, string> = {
  1: 'bg-zinc-400/15 dark:bg-zinc-400/10',
  2: 'bg-green-400/15 dark:bg-green-400/10',
  3: 'bg-blue-400/15 dark:bg-blue-400/10',
  4: 'bg-purple-400/15 dark:bg-purple-400/10',
  5: 'bg-amber-400/15 dark:bg-amber-400/10',
}

const GRADE_ICON_COLORS: Record<number, string> = {
  1: 'text-zinc-400',
  2: 'text-green-400',
  3: 'text-blue-400',
  4: 'text-purple-400',
  5: 'text-amber-400',
}

export function AchievementToast({ notifications, onDismiss }: AchievementToastProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  React.useEffect(() => {
    if (notifications.length === 0) return

    const current = notifications[0]
    const timer = setTimeout(() => {
      onDismiss(current.code)
    }, 5000)

    return () => clearTimeout(timer)
  }, [notifications, onDismiss])

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <AnimatePresence>
        {notifications.slice(0, 1).map((n) => {
          const lineColors = isDark ? GRADE_LINE_COLORS_DARK : GRADE_LINE_COLORS_LIGHT
          const [lineStart, lineEnd] = lineColors[n.grade] ?? lineColors[1]

          return (
            <motion.div
              key={n.code}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              className="pointer-events-auto"
            >
              <div className={cn(
                'relative flex flex-col items-center text-center px-11 py-6 rounded-2xl bg-white dark:bg-zinc-900 border overflow-hidden shadow-lg dark:shadow-none',
                GRADE_BORDER_COLORS[n.grade],
              )}>
                {/* 상단 그라데이션 라인 */}
                <div
                  className="absolute top-0 left-0 right-[40%] h-[1.5px]"
                  style={{ background: `linear-gradient(90deg, ${lineStart}, ${lineEnd})` }}
                />
                {/* 하단 그라데이션 라인 */}
                <div
                  className="absolute bottom-0 right-0 left-[40%] h-[1.5px]"
                  style={{ background: `linear-gradient(270deg, ${lineStart}, ${lineEnd})` }}
                />

                <p className="text-xs text-muted-foreground mb-3.5">
                  {n.type === 'achieved' ? '새로운 칭호를 달성했습니다' : '칭호 달성 조건 충족'}
                </p>
                <div className={cn(
                  'flex items-center justify-center h-11 w-11 rounded-full mb-3',
                  GRADE_ICON_BG[n.grade],
                )}>
                  <Trophy className={cn('h-5 w-5', GRADE_ICON_COLORS[n.grade])} />
                </div>
                <span className="text-lg font-bold text-foreground mb-1">{n.name}</span>
                <p className="text-xs text-muted-foreground mb-2.5">{n.description}</p>
                <span className={cn('text-[11px] tracking-widest', GRADE_COLORS[n.grade])}>
                  {gradeStars(n.grade)}
                </span>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
