"use client"

import * as React from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useAchievementSSE } from '@/hooks/useAchievementSSE'
import { AchievementToast, type AchievementNotification } from './AchievementToast'

/**
 * 전역 칭호 토스트 인프라 — `app/layout.tsx` 에서 한 번만 마운트.
 * 기존: `Timer.tsx` 한 곳에서만 SSE 마운트 → 타이머 페이지 외에서 토스트 누락.
 * 변경: layout 에서 전역 마운트 → 모든 페이지에서 칭호 토스트 수신.
 *
 * 댓글/멘션 알림과 통합하지 않음 (회수는 기존 AchievementSheet, 토스트는 즉시 축하).
 */
export function AchievementBridge() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [notifications, setNotifications] = React.useState<AchievementNotification[]>([])

  const handleAchievement = React.useCallback((n: AchievementNotification) => {
    setNotifications((prev) => {
      if (prev.some((p) => p.code === n.code)) return prev
      return [...prev, n]
    })
  }, [])

  const handleDismiss = React.useCallback((code: string) => {
    setNotifications((prev) => prev.filter((n) => n.code !== code))
  }, [])

  // 인증 안 됐으면 SSE 마운트도 안 함 — useAchievementSSE 가 토큰 없으면 noop
  useAchievementSSE({ onAchievement: handleAchievement })

  if (!isAuthenticated) return null

  return <AchievementToast notifications={notifications} onDismiss={handleDismiss} />
}
