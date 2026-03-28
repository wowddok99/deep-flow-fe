"use client"

import type { AchievementResponse } from '@/lib/api'
import { GRADE_COLORS, GRADE_BG, gradeStars } from '@/lib/achievement'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface AchievementCardProps {
  achievement: AchievementResponse
  isDisplay: boolean
  onSetDisplay: (code: string) => void
}

export function AchievementCard({ achievement, isDisplay, onSetDisplay }: AchievementCardProps) {
  const { code, name, description, grade, hidden, achieved } = achievement
  const isHiddenLocked = hidden && !achieved

  return (
    <div
      className={cn(
        'relative rounded-lg border p-3 transition-all',
        achieved
          ? GRADE_BG[grade] || GRADE_BG[1]
          : 'bg-muted/20 border-border/30 opacity-40',
        isDisplay && 'ring-1 ring-primary/50'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn('text-xs font-medium', GRADE_COLORS[grade] || GRADE_COLORS[1])}>
              {gradeStars(grade)}
            </span>
            <span className={cn(
              'text-sm font-medium truncate',
              isHiddenLocked ? 'text-muted-foreground/50 italic' : 'text-foreground'
            )}>
              {name}
            </span>
          </div>
          <p className={cn(
            'text-xs mt-1 line-clamp-1',
            isHiddenLocked ? 'text-muted-foreground/30 italic' : 'text-muted-foreground'
          )}>
            {description}
          </p>
        </div>

        {achieved && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onSetDisplay(code)
            }}
            className={cn(
              'flex-shrink-0 px-2 py-1 rounded text-[10px] font-medium transition-colors cursor-pointer',
              isDisplay
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            )}
          >
            {isDisplay ? (
              <span className="flex items-center gap-1"><Check className="h-3 w-3" />대표</span>
            ) : '대표'}
          </button>
        )}
      </div>
    </div>
  )
}
