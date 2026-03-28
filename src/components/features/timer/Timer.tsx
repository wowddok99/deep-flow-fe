"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTimerStore } from "@/store/timer-store"
import { api, achievementsApi, type AchievementResponse, type UserAchievementResponse } from "@/lib/api"
import { getApiErrorCode } from "@/lib/axios"
import { cn } from "@/lib/utils"
import { DEEP_DIVE_THRESHOLDS } from "@/lib/achievement"
import { AchievementToast, type AchievementNotification } from "@/components/features/achievement/AchievementToast"
import { useQueryClient } from "@tanstack/react-query"

interface DeepDiveTarget {
  code: string
  name: string
  description: string
  grade: number
  seconds: number
  notified: boolean
}

export function Timer() {
  const { isRunning, startTime, sessionId, startTimer, stopTimer } = useTimerStore()
  const [elapsed, setElapsed] = React.useState(0)
  const queryClient = useQueryClient()

  // 칭호 알림 상태
  const [notifications, setNotifications] = React.useState<AchievementNotification[]>([])
  const deepDiveTargetsRef = React.useRef<DeepDiveTarget[]>([])
  const beforeCodesRef = React.useRef<Set<string>>(new Set())

  const dismissNotification = React.useCallback((code: string) => {
    setNotifications(prev => prev.filter(n => n.code !== code))
  }, [])

  // 세션 시작 시 칭호 데이터 로드
  const loadAchievementData = React.useCallback(async () => {
    try {
      const [all, mine] = await Promise.all([
        achievementsApi.getAll(),
        achievementsApi.getMine(),
      ])

      // 세션 종료 후 비교용 - 현재 달성 코드 저장
      beforeCodesRef.current = new Set(mine.map(a => a.code))

      // DEEP_DIVE 미달성 칭호 필터링
      deepDiveTargetsRef.current = all
        .filter(a => a.category === 'DEEP_DIVE' && !a.achieved)
        .map(a => ({
          code: a.code,
          name: a.name,
          description: a.description,
          grade: a.grade,
          seconds: DEEP_DIVE_THRESHOLDS[a.code] || 0,
          notified: false,
        }))
        .filter(t => t.seconds > 0)
        .sort((a, b) => a.seconds - b.seconds)
    } catch (e) {
      console.debug("칭호 데이터 로드 실패", e)
    }
  }, [])

  // Sync active session on mount
  React.useEffect(() => {
    if (!isRunning) {
        api.sessions.list().then(({ content }) => {
            const activeSession = content.find(s => s.status === 'ONGOING');
            if (activeSession) {
                startTimer(activeSession.id, activeSession.startTime);
                loadAchievementData()
            }
        }).catch(err => {
            console.debug("Failed to sync session", err);
        });
    }
  }, []);

  // 타이머 업데이트 + DEEP_DIVE 선행 알림 체크
  React.useEffect(() => {
    let interval: NodeJS.Timeout

    if (isRunning && startTime) {
      const start = new Date(startTime).getTime()
      const update = () => {
        const now = new Date().getTime()
        const elapsedMs = now - start
        setElapsed(elapsedMs)

        // DEEP_DIVE 선행 알림 체크 (5초 버퍼)
        const elapsedSec = elapsedMs / 1000
        for (const target of deepDiveTargetsRef.current) {
          if (!target.notified && elapsedSec >= target.seconds + 5) {
            target.notified = true
            setNotifications(prev => [...prev, {
              code: target.code,
              name: target.name,
              description: target.description,
              grade: target.grade,
              type: 'preview',
            }])
          }
        }
      }
      update()
      interval = setInterval(update, 50)
    } else {
      setElapsed(0)
    }

    return () => clearInterval(interval)
  }, [isRunning, startTime])

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const handleStart = async () => {
    const tempId = Date.now()
    const tempStartTime = new Date().toISOString()
    startTimer(tempId, tempStartTime)

    try {
      const session = await api.sessions.start()
      startTimer(session.id, session.startTime)
      // 세션 시작 후 칭호 데이터 로드
      loadAchievementData()
    } catch (error: unknown) {
      console.error("Failed to start session", error)

      if (getApiErrorCode(error) === 'SESSION_ALREADY_EXISTS') {
          try {
              const { content } = await api.sessions.list()
              const ongoingSession = content.find(s => s.status === 'ONGOING')
              if (ongoingSession) {
                  startTimer(ongoingSession.id, ongoingSession.startTime)
                  loadAchievementData()
                  return
              }
          } catch (syncError) {
              console.error("Failed to sync session after conflict", syncError)
          }
      }

      stopTimer()
    }
  }

  const handleStop = async () => {
    if (!sessionId) return
    const currentId = sessionId
    const currentStartTime = startTime

    stopTimer()
    deepDiveTargetsRef.current = []

    try {
      await api.sessions.stop(currentId)

      // 비동기 처리 대기 후 신규 칭호 확인
      setTimeout(async () => {
        try {
          const after = await achievementsApi.getMine()
          const newAchievements = after.filter(a => !beforeCodesRef.current.has(a.code))

          if (newAchievements.length > 0) {
            // 기존 preview 알림 제거 후 achieved 알림 추가
            setNotifications(prev => {
              const withoutPreviews = prev.filter(n => n.type !== 'preview')
              return [
                ...withoutPreviews,
                ...newAchievements.map(a => ({
                  code: a.code,
                  name: a.name,
                  description: a.description,
                  grade: a.grade,
                  type: 'achieved' as const,
                }))
              ]
            })
          }

          // 칭호 쿼리 갱신
          queryClient.invalidateQueries({ queryKey: ['achievements'] })
          queryClient.invalidateQueries({ queryKey: ['achievements-mine'] })
        } catch (e) {
          console.debug("칭호 확인 실패", e)
        }
      }, 1000)
    } catch (error: any) {
      console.error("Failed to stop session", error)
      if (error.response?.status !== 404 && currentStartTime) {
          startTimer(currentId, currentStartTime)
      }
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-12 px-4 sm:px-6">
      <motion.div
        className="relative"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{
          opacity: 1,
          scale: 1,
          filter: "none"
        }}
        transition={{ duration: 0.5 }}
      >
        <div className={cn(
          "relative text-[10vw] md:text-[12rem] font-bold tracking-tighter tabular-nums leading-none select-none font-mono transition-colors duration-700",
          isRunning ? "text-foreground" : "text-muted-foreground/30"
        )}>
          {formatTime(elapsed)}
        </div>
      </motion.div>

      <div className="flex items-center space-x-6 z-10">
        <AnimatePresence mode="wait">
          {!isRunning ? (
            <motion.div
              key="start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Button
                size="icon"
                className="h-20 w-20 rounded-full text-2xl shadow-xl hover:scale-105 transition-transform cursor-pointer"
                onClick={handleStart}
              >
                <Play className="h-8 w-8 ml-1" />
                <span className="sr-only">Start</span>
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="stop"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Button
                size="icon"
                variant="outline"
                className="h-20 w-20 rounded-full text-2xl shadow-xl hover:scale-105 transition-transform border-2 cursor-pointer"
                onClick={handleStop}
              >
                <Square className="h-8 w-8 fill-current" />
                <span className="sr-only">Stop</span>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AchievementToast
        notifications={notifications}
        onDismiss={dismissNotification}
      />
    </div>
  )
}
