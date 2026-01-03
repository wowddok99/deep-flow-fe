"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTimerStore } from "@/store/timer-store"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

export function Timer() {
  const { isRunning, startTime, sessionId, startTimer, stopTimer } = useTimerStore()
  const [elapsed, setElapsed] = React.useState(0)

  React.useEffect(() => {
    let interval: NodeJS.Timeout

    if (isRunning && startTime) {
      const start = new Date(startTime).getTime()
      const update = () => {
        const now = new Date().getTime()
        setElapsed(now - start)
      }
      update() // Immediate update
      interval = setInterval(update, 50) // Smooth update
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
    try {
      // Optimistic update could be added here, but for now wait for server
      // Mocking for now since backend might not be ready or reachable
      // const session = await api.sessions.start()
      // startTimer(session.id, session.startTime)

      // Real implementation:
      const session = await api.sessions.start()
      startTimer(session.id, session.startTime)
    } catch (error) {
      console.error("Failed to start session", error)
      // Fallback for demo if backend is down:
      // const activeId = Date.now()
      // const activeStart = new Date().toISOString()
      // startTimer(activeId, activeStart)
    }
  }

  const handleStop = async () => {
    if (!sessionId) return
    try {
      await api.sessions.stop(sessionId)
      stopTimer()
    } catch (error: any) {
      console.error("Failed to stop session", error)
      // If session is not found (404), it means it's already stopped or deleted on server.
      // We should stop the local timer to sync state.
      if (error.response?.status === 404) {
          stopTimer()
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
        {/* Breathing Background Animation Removed for Minimal Look */}

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
    </div>
  )
}
