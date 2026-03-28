"use client"

import * as React from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { achievementsApi, type AchievementCategory, type AchievementResponse } from '@/lib/api'
import { CATEGORY_LABELS } from '@/lib/achievement'
import { AchievementCard } from './AchievementCard'
import { Loader2, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AchievementSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  displayCode: string | null
  onDisplayChange?: (code: string) => void
}

const CATEGORIES: (AchievementCategory | 'ALL')[] = [
  'ALL', ...Object.keys(CATEGORY_LABELS) as AchievementCategory[]
]

export function AchievementSheet({ open, onOpenChange, displayCode, onDisplayChange }: AchievementSheetProps) {
  const queryClient = useQueryClient()
  const [selectedCategory, setSelectedCategory] = React.useState<AchievementCategory | 'ALL'>('ALL')

  // Wheel + mouse drag → horizontal scroll
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const isDraggingRef = React.useRef(false)

  const handleWheel = React.useCallback((e: React.WheelEvent) => {
    const el = scrollRef.current
    if (!el) return
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault()
      el.scrollBy({ left: e.deltaY, behavior: 'smooth' })
    }
  }, [])

  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    const el = scrollRef.current
    if (!el) return
    const startX = e.clientX
    const startScroll = el.scrollLeft
    isDraggingRef.current = false

    const onMove = (me: MouseEvent) => {
      const dx = me.clientX - startX
      if (Math.abs(dx) > 3) isDraggingRef.current = true
      el.scrollLeft = startScroll - dx
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      setTimeout(() => { isDraggingRef.current = false }, 50)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [])

  const { data: achievements, isLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: achievementsApi.getAll,
    enabled: open,
  })

  const displayMutation = useMutation({
    mutationFn: achievementsApi.updateDisplay,
    onSuccess: (_data, code) => {
      onDisplayChange?.(code)
      queryClient.invalidateQueries({ queryKey: ['achievements'] })
      queryClient.invalidateQueries({ queryKey: ['achievements-mine'] })
    },
  })

  const filtered = React.useMemo(() => {
    if (!achievements) return []
    const list = selectedCategory === 'ALL'
      ? achievements
      : achievements.filter(a => a.category === selectedCategory)

    return list.sort((a, b) => {
      // 달성된 것 먼저
      if (a.achieved !== b.achieved) return a.achieved ? -1 : 1
      // 같은 상태면 등급순
      return a.grade - b.grade
    })
  }, [achievements, selectedCategory])

  const achievedCount = achievements?.filter(a => a.achieved).length ?? 0
  const totalCount = achievements?.length ?? 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-full sm:w-[600px] flex flex-col h-full bg-background/95 dark:bg-zinc-950/95 border-l-0 shadow-2xl backdrop-blur-sm sm:max-w-[600px] [&>button]:hidden outline-none"
      >
        <div className="absolute left-2 top-1/2 -translate-y-1/2 z-50">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-transparent cursor-pointer focus-visible:ring-0 focus-visible:ring-offset-0 transition-transform hover:scale-125"
            onClick={() => onOpenChange(false)}
          >
            <ChevronRight className="h-6 w-6" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        {/* Header + Category Filter (Toss style unified) */}
        <div className="sticky top-0 z-10 bg-background/95 dark:bg-zinc-950/95 backdrop-blur-sm">
          <div className="flex items-center justify-between px-4 pt-1 pb-3">
            <SheetHeader className="space-y-0 p-0">
              <SheetTitle className="text-base">칭호 도감</SheetTitle>
            </SheetHeader>
            <span className="text-xs text-muted-foreground tabular-nums">{achievedCount}/{totalCount}</span>
          </div>
          <div
            ref={scrollRef}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            className="flex gap-1 px-4 pb-3 overflow-x-auto scrollbar-none cursor-grab active:cursor-grabbing select-none"
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={(e) => {
                  if (isDraggingRef.current) return
                  setSelectedCategory(cat)
                  const btn = e.currentTarget
                  const container = scrollRef.current
                  if (container) {
                    const btnLeft = btn.offsetLeft - container.offsetLeft
                    const btnRight = btnLeft + btn.offsetWidth
                    const visibleLeft = container.scrollLeft
                    const visibleRight = visibleLeft + container.clientWidth

                    if (btnLeft < visibleLeft + 80) {
                      container.scrollTo({ left: btnLeft - 80, behavior: 'smooth' })
                    } else if (btnRight > visibleRight - 80) {
                      container.scrollTo({ left: btnRight - container.clientWidth + 80, behavior: 'smooth' })
                    }
                  }
                }}
                className="relative px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap cursor-pointer z-0 flex-shrink-0"
              >
                {selectedCategory === cat && (
                  <motion.span
                    layoutId="achievement-tab"
                    className="absolute inset-0 rounded-full bg-primary z-[-1]"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className={cn(
                  'relative',
                  selectedCategory === cat
                    ? 'text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}>
                  {cat === 'ALL' ? '전체' : CATEGORY_LABELS[cat]}
                </span>
              </button>
            ))}
          </div>
          <div className="mx-4 h-px bg-border/50" />
        </div>

        {/* Achievement List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {filtered.map((achievement) => (
                <AchievementCard
                  key={achievement.code}
                  achievement={achievement}
                  isDisplay={achievement.code === displayCode}
                  onSetDisplay={(code) => displayMutation.mutate(code)}
                />
              ))}
              {filtered.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-8">
                  해당 카테고리에 칭호가 없습니다
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
