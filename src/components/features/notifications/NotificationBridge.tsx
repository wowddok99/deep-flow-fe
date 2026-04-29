"use client"

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/useAuthStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useNotificationSSE } from '@/hooks/useNotificationSSE'
import { notificationApi, notificationKeys } from '@/lib/api'

/**
 * 전역 알림 인프라 마운트 — `app/layout.tsx` 에서 한 번만 호출.
 * - SSE 구독 (어디서든 알림 수신)
 * - 마운트 시 1회 unread 동기화 (새로고침 후 store 복구)
 * - 사용자 인증 됐을 때만 동작
 */
export function NotificationBridge() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const setInitial = useNotificationStore((s) => s.setInitial)
  const reset = useNotificationStore((s) => s.reset)

  // SSE 구독 (인증 됐을 때만 의미)
  useNotificationSSE()

  const { data } = useQuery({
    queryKey: notificationKeys.unread,
    queryFn: () => notificationApi.unread(undefined, 50),
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  })

  React.useEffect(() => {
    if (!isAuthenticated) {
      reset()
      return
    }
    if (data) {
      setInitial(data.content, data.content.filter((n) => !n.read).length)
    }
  }, [isAuthenticated, data, setInitial, reset])

  return null
}
