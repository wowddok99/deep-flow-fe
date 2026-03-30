import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface NavState {
  isCollapsed: boolean
  isRightCollapsed: boolean
  toggleCollapse: () => void
  toggleRightCollapse: () => void
}

export const useNavStore = create<NavState>()(
  persist(
    (set) => ({
      isCollapsed: false,
      isRightCollapsed: false,
      toggleCollapse: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
      toggleRightCollapse: () => set((state) => ({ isRightCollapsed: !state.isRightCollapsed })),
    }),
    {
      name: 'deep-flow-nav-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
