"use client"

import { useQuery } from '@tanstack/react-query'
import { statsApi, StatsDashboardAll } from '@/lib/api'

export function useCalendar(year: number, month: number) {
  return useQuery({
    queryKey: ['stats', 'calendar', year, month],
    queryFn: () => statsApi.calendar(year, month),
  })
}

/** 통합 Stats 훅 — calendar 제외 5개 API를 단일 요청으로 처리 */
export function useStatsDashboardAll() {
  return useQuery<StatsDashboardAll>({
    queryKey: ['stats', 'all'],
    queryFn: statsApi.all,
    staleTime: 60 * 1000,
  })
}
