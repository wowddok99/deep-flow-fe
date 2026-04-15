"use client"

import * as React from 'react'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface CalendarDay {
  date: string
  totalSessions: number
  totalDurationSeconds: number
}

interface CalendarHeatmapProps {
  data: CalendarDay[]
  year: number
  month: number
  onMonthChange: (year: number, month: number) => void
}

function getIntensity(seconds: number): string {
  if (seconds === 0) return 'bg-muted'
  if (seconds < 1800) return 'bg-green-400/20 dark:bg-green-400/15'
  if (seconds < 3600) return 'bg-green-400/40 dark:bg-green-400/30'
  if (seconds < 7200) return 'bg-green-400/60 dark:bg-green-400/50'
  return 'bg-green-400/90 dark:bg-green-400/80'
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}시간 ${m}분`
  return `${m}분`
}

export function CalendarHeatmap({ data, year, month, onMonthChange }: CalendarHeatmapProps) {
  const dataMap = React.useMemo(() => {
    const map = new Map<string, CalendarDay>()
    data.forEach(d => map.set(d.date, d))
    return map
  }, [data])

  const days = React.useMemo(() => {
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    const startDow = firstDay.getDay() // 0=일 1=월 ...
    const totalDays = lastDay.getDate()

    const cells: (CalendarDay | null)[] = []

    // 앞쪽 빈칸 (월요일 시작)
    const offset = startDow === 0 ? 6 : startDow - 1
    for (let i = 0; i < offset; i++) cells.push(null)

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const dayData = dataMap.get(dateStr)
      cells.push(dayData ?? { date: dateStr, totalSessions: 0, totalDurationSeconds: 0 })
    }

    return cells
  }, [year, month, dataMap])

  const handlePrev = () => {
    if (month === 1) onMonthChange(year - 1, 12)
    else onMonthChange(year, month - 1)
  }

  const handleNext = () => {
    if (month === 12) onMonthChange(year + 1, 1)
    else onMonthChange(year, month + 1)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer" onClick={handlePrev}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">{year}년 {month}월</span>
        <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer" onClick={handleNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['월', '화', '수', '목', '금', '토', '일'].map((d) => (
          <div key={d} className="text-[10px] text-muted-foreground text-center">{d}</div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />

          const dateNum = parseInt(day.date.split('-')[2])

          return (
            <Tooltip key={day.date} delayDuration={0}>
              <TooltipTrigger asChild>
                <div className={cn(
                  'aspect-square rounded-sm flex items-center justify-center text-[10px] transition-colors',
                  getIntensity(day.totalDurationSeconds),
                  (day.totalSessions > 0 || day.totalDurationSeconds > 0) ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {dateNum}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  {day.date}
                  {day.totalSessions > 0
                    ? ` · ${day.totalSessions}세션`
                    : day.totalDurationSeconds > 0
                      ? ' · 연속 집중'
                      : ''}
                  {day.totalDurationSeconds > 0 && ` · ${formatDuration(day.totalDurationSeconds)}`}
                </p>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </div>
  )
}
