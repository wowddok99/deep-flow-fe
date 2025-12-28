import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface TimerState {
  isRunning: boolean
  startTime: string | null // ISO string
  sessionId: number | null
  
  startTimer: (sessionId: number, startTime: string) => void
  stopTimer: () => void
  setIsRunning: (isRunning: boolean) => void
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set) => ({
      isRunning: false,
      startTime: null,
      sessionId: null,
      
      startTimer: (sessionId, startTime) => set({ isRunning: true, sessionId, startTime }),
      stopTimer: () => set({ isRunning: false, sessionId: null, startTime: null }),
      setIsRunning: (isRunning) => set({ isRunning }),
    }),
    {
      name: 'deep-flow-timer-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
