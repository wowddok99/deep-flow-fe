"use client"

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Timer, ScrollText, BarChart3, Users, LogOut, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { useNavStore } from '@/store/useNavStore'
import { useAuthStore } from '@/store/useAuthStore'
import { DisplayAchievement } from '@/components/features/achievement/DisplayAchievement'
import { ModeToggle } from '@/components/mode-toggle'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const NAV_ITEMS = [
  { href: '/app', icon: Timer, label: '타이머' },
  { href: '/app/sessions', icon: ScrollText, label: '세션' },
  { href: '/app/stats', icon: BarChart3, label: '통계' },
  { href: '/app/crews', icon: Users, label: '크루' },
]

function useIsActive(href: string) {
  const pathname = usePathname()
  if (href === '/app') return pathname === '/app'
  return pathname.startsWith(href)
}

/** 데스크톱 왼쪽 사이드바 네비게이션 */
export function AppNav() {
  const pathname = usePathname()
  const { isCollapsed, toggleCollapse } = useNavStore()
  const logout = useAuthStore((s) => s.logout)
  const [autoCollapsed, setAutoCollapsed] = React.useState(false)

  // 창 너비 1024px 미만이면 자동 접기
  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 1024px)')
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      setAutoCollapsed(e.matches)
    }
    handler(mq)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const effectiveCollapsed = autoCollapsed || isCollapsed

  const isActive = (href: string) => {
    if (href === '/app') return pathname === '/app'
    return pathname.startsWith(href)
  }

  return (
    <>
      <motion.nav
        animate={{ width: effectiveCollapsed ? 64 : 220 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex flex-col h-full border-r border-border bg-background flex-shrink-0 overflow-hidden"
      >
        {/* Logo + 칭호 */}
        <div className="px-3 pt-4 pb-2">
          <div className="flex items-center gap-2 px-2 mb-1">
            <AnimatePresence mode="wait">
              {!effectiveCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm font-bold text-foreground whitespace-nowrap"
                >
                  Deep Flow
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          {!effectiveCollapsed && (
            <div className="px-2">
              <DisplayAchievement />
            </div>
          )}
        </div>

        {/* Nav Items */}
        <div className="flex-1 px-2 py-2 space-y-1">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = isActive(href)
            const linkContent = (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  active
                    ? 'bg-secondary text-foreground font-medium'
                    : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <AnimatePresence mode="wait">
                  {!effectiveCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            )

            if (effectiveCollapsed) {
              return (
                <Tooltip key={href} delayDuration={0}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {label}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return <React.Fragment key={href}>{linkContent}</React.Fragment>
          })}
        </div>

        {/* Bottom Section */}
        <div className="px-2 pb-3 space-y-1">
          <div className={cn('flex items-center', effectiveCollapsed ? 'justify-center gap-1 flex-col' : 'px-3 gap-2')}>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <div><ModeToggle /></div>
              </TooltipTrigger>
              <TooltipContent side={effectiveCollapsed ? 'right' : 'top'}>테마 변경</TooltipContent>
            </Tooltip>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => logout()}
                  className="flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side={effectiveCollapsed ? 'right' : 'top'}>로그아웃</TooltipContent>
            </Tooltip>
          </div>

          {!autoCollapsed && (
            <button
              onClick={toggleCollapse}
              className={cn(
                'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors cursor-pointer',
                effectiveCollapsed && 'justify-center'
              )}
            >
              {effectiveCollapsed ? (
                <ChevronsRight className="h-4 w-4" />
              ) : (
                <>
                  <ChevronsLeft className="h-4 w-4" />
                  <span>접기</span>
                </>
              )}
            </button>
          )}
        </div>
      </motion.nav>

    </>
  )
}

