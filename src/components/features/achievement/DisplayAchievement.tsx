"use client"

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { achievementsApi } from '@/lib/api'
import { GRADE_COLORS, gradeStars } from '@/lib/achievement'
import { AchievementSheet } from './AchievementSheet'
import { Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

export function DisplayAchievement() {
  const [sheetOpen, setSheetOpen] = React.useState(false)

  const { data: myAchievements } = useQuery({
    queryKey: ['achievements-mine'],
    queryFn: achievementsApi.getMine,
  })

  // 대표 칭호는 GET /achievements에서 achieved 중 display 상태를 확인해야 하는데
  // 현재 API에는 display 여부가 없으므로, 별도 상태로 관리
  // 대안: achievements/me의 첫번째(가장 최근) 또는 서버에서 display 정보를 내려줄 때까지
  // 일단 GET /achievements 에서 display 설정한 칭호를 추적
  const { data: allAchievements } = useQuery({
    queryKey: ['achievements'],
    queryFn: achievementsApi.getAll,
  })

  // displayCode를 localStorage로 관리 (서버에서 display 정보를 내려주는 API가 별도로 없으므로)
  const [displayCode, setDisplayCode] = React.useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('display-achievement') || null
    }
    return null
  })

  // AchievementSheet에서 대표 설정 시 로컬에도 반영
  const handleSetDisplay = React.useCallback((code: string) => {
    setDisplayCode(code)
    localStorage.setItem('display-achievement', code)
  }, [])

  // Sheet에서 대표 설정을 감지
  const wrappedSheetOpen = React.useCallback((open: boolean) => {
    setSheetOpen(open)
  }, [])

  const displayAchievement = allAchievements?.find(a => a.code === displayCode && a.achieved)

  return (
    <>
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="flex items-center gap-1.5 py-0.5 cursor-pointer text-left min-w-0 hover:brightness-125 active:scale-95 transition-all duration-150"
      >
        <Trophy className={cn(
          'h-3.5 w-3.5 flex-shrink-0',
          displayAchievement ? GRADE_COLORS[displayAchievement.grade] : 'text-muted-foreground/50'
        )} />
        {displayAchievement ? (
          <span className={cn(
            'text-xs font-medium truncate',
            GRADE_COLORS[displayAchievement.grade]
          )}>
            {displayAchievement.name}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/50 truncate">
            칭호를 선택하세요
          </span>
        )}
      </button>

      <AchievementSheet
        open={sheetOpen}
        onOpenChange={wrappedSheetOpen}
        displayCode={displayCode}
        onDisplayChange={handleSetDisplay}
      />
    </>
  )
}
