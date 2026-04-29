"use client"

import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useQueryClient } from '@tanstack/react-query'
import { useNotificationStore } from '@/store/useNotificationStore'
import { notificationKeys, type NotificationItem } from '@/lib/api'

interface SSENotificationPayload {
  type: 'COMMENT_ON_YOUR_POST' | 'MENTION'
  sessionId: number
  commentId: number
  actorUserId: number
  actorName: string
  contentPreview: string
  // BE 가 mention id 자체를 페이로드에 포함하지 않을 수 있어
  // 도착 즉시는 임시 id 로 push 하고, 최종 정확한 id 는
  // notificationApi.unread() 재호출로 동기화.
  notificationId?: number
}

/**
 * 댓글/멘션 알림 SSE 구독.
 * 조용한 패턴 — 토스트 X, store 갱신만. 종 아이콘 카운트 + 팝오버에 자동 반영.
 *
 * useAchievementSSE 패턴과 동일 (재연결, 토큰 변경 대응).
 */
export function useNotificationSSE() {
  const queryClient = useQueryClient()
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pushIncoming = useNotificationStore((s) => s.pushIncoming)

  const connect = useCallback(() => {
    const token = useAuthStore.getState().accessToken
    if (!token) return

    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
    const url = `${baseUrl}/api/v1/notifications/comments/stream?token=${token}`
    const es = new EventSource(url)
    eventSourceRef.current = es

    es.addEventListener('connect', () => {
      console.debug('[SSE] 알림 스트림 연결됨')
    })

    es.addEventListener('notification', (event) => {
      try {
        const data: SSENotificationPayload = JSON.parse(event.data)
        // SSE 페이로드를 NotificationItem 형태로 매핑.
        // notificationId 없으면 임시 음수 id (서버 동기화 시 재정렬됨).
        const item: NotificationItem = {
          id: data.notificationId ?? -Date.now(),
          commentId: data.commentId,
          sessionId: data.sessionId,
          crewId: null,                    // SSE 페이로드에 crewId 없음 → 동기화 후 채워짐
          actorName: data.actorName,
          contentPreview: data.contentPreview,
          createdAt: new Date().toISOString(),
          read: false,
        }
        pushIncoming(item)
        // 정확한 알림 정보 (id, crewId 포함) 동기화
        queryClient.invalidateQueries({ queryKey: notificationKeys.unread })
      } catch (e) {
        console.error('[SSE] 알림 이벤트 파싱 실패', e)
      }
    })

    es.onerror = () => {
      es.close()
      eventSourceRef.current = null

      reconnectTimeoutRef.current = setTimeout(async () => {
        try {
          await useAuthStore.getState().checkAuth()
          connect()
        } catch {
          console.debug('[SSE] 알림 재연결 실패')
        }
      }, 3000)
    }
  }, [pushIncoming, queryClient])

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

  useEffect(() => {
    const unsub = useAuthStore.subscribe((state, prev) => {
      if (state.accessToken !== prev.accessToken) {
        if (state.accessToken) connect()
        else disconnect()
      }
    })
    return unsub
  }, [connect, disconnect])

  return { reconnect: connect, disconnect }
}
