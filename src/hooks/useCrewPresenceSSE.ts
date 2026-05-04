"use client"

import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/useAuthStore'
import { crewKeys, type CrewSummary, type CrewDetail } from '@/lib/api'

interface CrewPresencePayload {
  crewId: number
  userId: number
  userName: string
  isActive: boolean
  activeNowCount: number
}

export function useCrewPresenceSSE() {
  const queryClient = useQueryClient()
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const connect = useCallback(() => {
    const token = useAuthStore.getState().accessToken
    if (!token) return

    if (eventSourceRef.current) eventSourceRef.current.close()

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
    const url = `${baseUrl}/api/v1/crews/presence/stream?token=${token}`
    const es = new EventSource(url)
    eventSourceRef.current = es

    es.addEventListener('connect', () => {
      console.debug('[SSE] 크루 프레즌스 스트림 연결됨')
    })

    es.addEventListener('crew-presence', (event) => {
      try {
        const payload: CrewPresencePayload = JSON.parse(event.data)

        queryClient.setQueryData<CrewSummary[] | undefined>(crewKeys.mine(), (old) =>
          old?.map((c) =>
            c.id === payload.crewId ? { ...c, activeNowCount: payload.activeNowCount } : c
          )
        )

        queryClient.setQueryData<CrewDetail | undefined>(
          crewKeys.detail(payload.crewId),
          (old) => {
            if (!old) return old
            return {
              ...old,
              activeNowCount: payload.activeNowCount,
              members: old.members.map((m) =>
                m.userId === payload.userId ? { ...m, isActiveNow: payload.isActive } : m
              ),
            }
          }
        )
      } catch (e) {
        console.error('[SSE] 크루 프레즌스 파싱 실패', e)
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
          console.debug('[SSE] 크루 프레즌스 재연결 실패')
        }
      }, 3000)
    }
  }, [queryClient])

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
    const unsub = useAuthStore.subscribe((state, prevState) => {
      if (state.accessToken !== prevState.accessToken) {
        if (state.accessToken) connect()
        else disconnect()
      }
    })
    return unsub
  }, [connect, disconnect])

  return { reconnect: connect, disconnect }
}
