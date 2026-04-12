"use client"

import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChangeResult {
  type: 'percent' | 'absolute'
  value: number
  direction: 'up' | 'down' | 'same'
}

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string
  sub?: string
  change?: ChangeResult | null
  unit?: string
  formatAbsolute?: (value: number) => string
}

export function StatCard({ icon: Icon, label, value, sub, change, unit = '', formatAbsolute }: StatCardProps) {
  return (
    <div className="flex flex-col gap-2 p-4 rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <span className="text-2xl font-bold">{value}</span>
        {sub && <span className="text-xs text-muted-foreground ml-2">{sub}</span>}
      </div>
      {change && (
        <span className={cn(
          'text-xs font-medium',
          change.direction === 'up' ? 'text-green-500'
            : change.direction === 'down' ? 'text-red-500'
            : 'text-muted-foreground'
        )}>
          {change.direction === 'same'
            ? '지난주와 같아요'
            : change.type === 'absolute'
              ? `지난주보다 ${formatAbsolute ? formatAbsolute(change.value) : `${change.value}${unit}`} 늘었어요`
              : `지난주보다 ${change.value}% ${change.direction === 'up' ? '늘었어요' : '줄었어요'}`}
        </span>
      )}
    </div>
  )
}
