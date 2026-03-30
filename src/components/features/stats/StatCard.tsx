"use client"

import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string
  sub?: string
  change?: number // 퍼센트 변화
}

export function StatCard({ icon: Icon, label, value, sub, change }: StatCardProps) {
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
      {change !== undefined && (
        <span className={cn(
          'text-xs font-medium',
          change >= 0 ? 'text-green-500' : 'text-red-500'
        )}>
          {change >= 0 ? '+' : ''}{change}% vs 지난주
        </span>
      )}
    </div>
  )
}
