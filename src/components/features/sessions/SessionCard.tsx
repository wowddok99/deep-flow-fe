"use client"

import type { SessionSummary } from '@/lib/api'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SessionCardProps {
  session: SessionSummary
  onClick: () => void
  onDelete?: (id: number) => void
  compact?: boolean
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export function SessionCard({ session, onClick, onDelete, compact }: SessionCardProps) {
  return (
    <div
      className={cn(
        'group flex flex-col gap-1 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer border border-transparent hover:border-border/50 relative',
        compact ? 'py-3 px-3' : 'py-4 px-3'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={cn(
          'font-medium truncate flex-1 min-w-0',
          compact ? 'text-xs' : 'text-sm'
        )}>
          {session.title || `Session #${session.id}`}
        </span>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={cn(
            'inline-flex items-center px-1.5 py-0.5 rounded font-medium bg-muted text-muted-foreground',
            compact ? 'text-[10px]' : 'text-[10px]'
          )}>
            {formatDuration(session.durationSeconds)}
          </span>
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                if (session.status === 'ONGOING') {
                  alert("진행 중인 세션은 삭제할 수 없습니다.")
                  return
                }
                onDelete(session.id)
              }}
            >
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          )}
        </div>
      </div>

      {!compact && (
        <p className="text-xs text-muted-foreground line-clamp-2 break-words mt-0.5">
          {session.summary || "No summary"}
        </p>
      )}

      <div className="flex items-center gap-2 mt-1">
        <span className="text-[10px] text-muted-foreground">
          {new Date(session.startTime).toLocaleDateString()}
        </span>
        {session.status === 'ONGOING' && (
          <span className="text-[10px] text-green-500 font-medium">진행중</span>
        )}
      </div>
    </div>
  )
}
