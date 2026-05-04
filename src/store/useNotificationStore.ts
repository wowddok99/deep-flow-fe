import { create } from 'zustand'
import type { NotificationItem } from '@/lib/api'

interface NotificationState {
  unreadCount: number
  items: NotificationItem[]               // 최근 N 개 캐시 (드롭다운 표시용)
  hasInitialFetch: boolean

  setInitial: (items: NotificationItem[], unreadCount: number) => void
  pushIncoming: (item: NotificationItem) => void
  markRead: (id: number) => void
  markAllRead: () => void
  reset: () => void
}

const MAX_CACHED = 50

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  items: [],
  hasInitialFetch: false,

  setInitial: (items, unreadCount) => {
    set({ items: items.slice(0, MAX_CACHED), unreadCount, hasInitialFetch: true })
  },

  pushIncoming: (item) => {
    set((state) => {
      // 중복 방지 (이미 있는 id 면 스킵)
      if (state.items.some((it) => it.id === item.id)) return state
      const next = [item, ...state.items].slice(0, MAX_CACHED)
      return {
        items: next,
        unreadCount: state.unreadCount + (item.read ? 0 : 1),
      }
    })
  },

  markRead: (id) => {
    set((state) => {
      const target = state.items.find((it) => it.id === id)
      if (!target || target.read) return state
      return {
        items: state.items.map((it) => (it.id === id ? { ...it, read: true } : it)),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }
    })
  },

  markAllRead: () => {
    set((state) => ({
      items: state.items.map((it) => ({ ...it, read: true })),
      unreadCount: 0,
    }))
  },

  reset: () => set({ unreadCount: 0, items: [], hasInitialFetch: false }),
}))
