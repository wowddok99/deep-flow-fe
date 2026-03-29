"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTimerStore } from "@/store/timer-store"
import { api } from "@/lib/api"
import { getApiErrorCode } from "@/lib/axios"
import { cn } from "@/lib/utils"
import { AchievementToast, type AchievementNotification } from "@/components/features/achievement/AchievementToast"
import { useAchievementSSE } from "@/hooks/useAchievementSSE"

export function Timer() {
  const { isRunning, startTime, sessionId, startTimer, stopTimer } = useTimerStore()
  const [elapsed, setElapsed] = React.useState(0)

  // 칭호 알림 상태
  const [notifications, setNotifications] = React.useState<AchievementNotification[]>([])

  const dismissNotification = React.useCallback((code: string) => {
    setNotifications(prev => prev.filter(n => n.code !== code))
  }, [])

  // SSE로 칭호 알림 수신
  const handleAchievement = React.useCallback((notification: AchievementNotification) => {
    setNotifications(prev => {
      // 중복 방지
      if (prev.some(n => n.code === notification.code)) return prev
      return [...prev, notification]
    })
  }, [])

  useAchievementSSE({ onAchievement: handleAchievement })

  // Sync active session on mount
  React.useEffect(() => {
    api.sessions.list().then(({ content }) => {
      const activeSession = content.find(s => s.status === 'ONGOING');
      if (activeSession) {
        startTimer(activeSession.id, activeSession.startTime);
      } else if (isRunning) {
        // persist된 상태가 남아있지만 서버에 ONGOING 세션 없음 → 초기화
        stopTimer();
      }
    }).catch(err => {
      console.debug("Failed to sync session", err);
    });
  }, []);

  // 타이머 업데이트
  React.useEffect(() => {
    let interval: NodeJS.Timeout

    if (isRunning && startTime) {
      const start = new Date(startTime).getTime()
      const update = () => {
        const now = new Date().getTime()
        const elapsedMs = now - start
        setElapsed(elapsedMs)
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
    } catch (error: unknown) {
      console.error("Failed to start session", error)

      if (getApiErrorCode(error) === 'SESSION_ALREADY_EXISTS') {
          try {
              const { content } = await api.sessions.list()
              const ongoingSession = content.find(s => s.status === 'ONGOING')
              if (ongoingSession) {
                  startTimer(ongoingSession.id, ongoingSession.startTime)
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

    try {
      await api.sessions.stop(currentId)
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
