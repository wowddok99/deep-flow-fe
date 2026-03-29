"use client"

import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useQueryClient } from '@tanstack/react-query'
import type { AchievementNotification } from '@/components/features/achievement/AchievementToast'

interface SSEAchievementData {
  code: string
  name: string
  description: string
  category: string
  grade: number
}

interface UseAchievementSSEOptions {
  onAchievement: (notification: AchievementNotification) => void
}

export function useAchievementSSE({ onAchievement }: UseAchievementSSEOptions) {
  const queryClient = useQueryClient()
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const connect = useCallback(() => {
    const token = useAuthStore.getState().accessToken
    if (!token) return

    // 기존 연결 정리
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
    const url = `${baseUrl}/api/v1/achievements/stream?token=${token}`
    const es = new EventSource(url)
    eventSourceRef.current = es

    es.addEventListener('connect', () => {
      console.debug('[SSE] 칭호 스트림 연결됨')
    })

    es.addEventListener('achievement', (event) => {
      try {
        const data: SSEAchievementData = JSON.parse(event.data)
        onAchievement({
          code: data.code,
          name: data.name,
          description: data.description,
          grade: data.grade,
          type: 'achieved',
        })

        // 칭호 캐시 갱신
        queryClient.invalidateQueries({ queryKey: ['achievements'] })
        queryClient.invalidateQueries({ queryKey: ['achievements-mine'] })
      } catch (e) {
        console.error('[SSE] 칭호 이벤트 파싱 실패', e)
      }
    })

    es.onerror = () => {
      es.close()
      eventSourceRef.current = null

      // 토큰 갱신 후 재연결 시도
      reconnectTimeoutRef.current = setTimeout(async () => {
        try {
          await useAuthStore.getState().checkAuth()
          connect()
        } catch {
          console.debug('[SSE] 재연결 실패')
        }
      }, 3000)
    }
  }, [onAchievement, queryClient])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
  }, [])

  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  // 토큰 변경 시 재연결
  useEffect(() => {
    const unsub = useAuthStore.subscribe((state, prevState) => {
      if (state.accessToken !== prevState.accessToken) {
        if (state.accessToken) {
          connect()
        } else {
          disconnect()
        }
      }
    })
    return unsub
  }, [connect, disconnect])

  return { reconnect: connect, disconnect }
}
