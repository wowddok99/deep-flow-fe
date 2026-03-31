"use client"

import { useQuery } from '@tanstack/react-query'
import { statsApi } from '@/lib/api'

export function useDashboard() {
  return useQuery({
    queryKey: ['stats', 'dashboard'],
    queryFn: statsApi.dashboard,
  })
}

export function useWeeklyTrend(weeks = 4) {
  return useQuery({
    queryKey: ['stats', 'weekly-trend', weeks],
    queryFn: () => statsApi.weeklyTrend(weeks),
  })
}

export function useDayOfWeek() {
  return useQuery({
    queryKey: ['stats', 'day-of-week'],
    queryFn: statsApi.dayOfWeek,
  })
}

export function useHourly() {
  return useQuery({
    queryKey: ['stats', 'hourly'],
    queryFn: statsApi.hourly,
  })
}

export function useCalendar(year: number, month: number) {
  return useQuery({
    queryKey: ['stats', 'calendar', year, month],
    queryFn: () => statsApi.calendar(year, month),
  })
}

export function useLogActivity() {
  return useQuery({
    queryKey: ['stats', 'activity'],
    queryFn: statsApi.activity,
  })
}
