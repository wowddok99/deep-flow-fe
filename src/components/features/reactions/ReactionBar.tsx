"use client"

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { SmilePlus } from 'lucide-react'
import { reactionApi, reactionKeys, type EmojiCount, type ReactionAggregate } from '@/lib/api'
import { useAuthStore } from '@/store/useAuthStore'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface ReactionBarProps {
  sessionId: number
}

export function ReactionBar({ sessionId }: ReactionBarProps) {
  const queryClient = useQueryClient()
  const viewerId = useAuthStore((s) => s.user?.id ?? null)

  const { data, isLoading } = useQuery({
    queryKey: reactionKeys.aggregate(sessionId),
    queryFn: () => reactionApi.aggregate(sessionId),
    staleTime: 30 * 1000,
  })

  const toggleMutation = useMutation({
    mutationFn: (emoji: string) => reactionApi.toggle(sessionId, emoji),
    onMutate: async (emoji) => {
      await queryClient.cancelQueries({ queryKey: reactionKeys.aggregate(sessionId) })
      const prev = queryClient.getQueryData<ReactionAggregate>(reactionKeys.aggregate(sessionId))
      queryClient.setQueryData<ReactionAggregate>(reactionKeys.aggregate(sessionId), (old) => {
        const items = old?.items ?? []
        return {
          items: items.map((it) => {
            if (it.emoji !== emoji) return it
            const reactors = it.topReactors ?? []
            return it.userReacted
              ? {
                  ...it,
                  count: Math.max(0, it.count - 1),
                  userReacted: false,
                  topReactors: reactors.filter((r) => r.userId !== viewerId),
                }
              : {
                  ...it,
                  count: it.count + 1,
                  userReacted: true,
                  topReactors: reactors,
                }
          }),
        }
      })
      return { prev }
    },
    onError: (_err, _emoji, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(reactionKeys.aggregate(sessionId), ctx.prev)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: reactionKeys.aggregate(sessionId) })
    },
  })

  const items = data?.items ?? []
  const chips = items.filter((it) => it.count > 0)

  const onToggle = (emoji: string) => {
    if (toggleMutation.isPending) return
    toggleMutation.mutate(emoji)
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <AnimatePresence mode="popLayout" initial={false}>
        {chips.map((it) => (
          <motion.div
            key={it.emoji}
            layout
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <ReactionChip
              item={it}
              viewerId={viewerId}
              disabled={isLoading || toggleMutation.isPending}
              onToggle={onToggle}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      <ReactionPicker
        options={items}
        disabled={isLoading || toggleMutation.isPending}
        onPick={onToggle}
      />
    </div>
  )
}

interface ReactionChipProps {
  item: EmojiCount
  viewerId: number | null
  disabled: boolean
  onToggle: (emoji: string) => void
}

function ReactionChip({ item, viewerId: _viewerId, disabled, onToggle }: ReactionChipProps) {
  const tooltip = formatReactorTooltip(item)
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => onToggle(item.emoji)}
          disabled={disabled}
          className={cn(
            'inline-flex items-center justify-center gap-1 rounded-md px-2.5 py-1 text-sm transition-colors cursor-pointer border min-w-[3.25rem] disabled:cursor-not-allowed disabled:opacity-70',
            item.userReacted
              ? 'bg-foreground/10 border-foreground/25 text-foreground'
              : 'bg-muted/50 border-transparent hover:bg-muted text-muted-foreground hover:text-foreground'
          )}
        >
          <span className="leading-none">{item.emoji}</span>
          <span className="text-xs tabular-nums">{item.count}</span>
        </button>
      </TooltipTrigger>
      {tooltip && (
        <TooltipContent className="text-xs px-2.5 py-1 font-normal">
          {tooltip}
        </TooltipContent>
      )}
    </Tooltip>
  )
}

interface ReactionPickerProps {
  options: EmojiCount[]
  disabled: boolean
  onPick: (emoji: string) => void
}

function ReactionPicker({ options, disabled, onPick }: ReactionPickerProps) {
  const [open, setOpen] = React.useState(false)

  const handlePick = (emoji: string) => {
    onPick(emoji)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled || options.length === 0}
          aria-label="이모지로 반응하기"
          className={cn(
            'inline-flex items-center justify-center rounded-md w-8 h-8 transition-colors cursor-pointer',
            'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
          <SmilePlus className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-auto p-1.5"
      >
        <div className="flex items-center gap-0.5">
          {options.map((it) => (
            <button
              key={it.emoji}
              type="button"
              onClick={() => handlePick(it.emoji)}
              className={cn(
                'inline-flex items-center justify-center rounded-md w-9 h-9 text-lg transition-colors cursor-pointer',
                it.userReacted
                  ? 'bg-foreground/10 ring-1 ring-foreground/30'
                  : 'hover:bg-muted'
              )}
            >
              {it.emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

const TOOLTIP_NAME_LIMIT = 3

function formatReactorTooltip(item: EmojiCount): string {
  const { count, topReactors } = item
  if (count === 0) return ''

  const names = (topReactors ?? []).slice(0, TOOLTIP_NAME_LIMIT).map((r) => r.name)
  if (names.length === 0) {
    return `${count}명이 반응했어요.`
  }

  const namePart = `${names.join(', ')}님`
  const remaining = Math.max(0, count - names.length)
  if (count === 1) {
    return `${namePart}이 반응했어요.`
  }
  return remaining > 0
    ? `${namePart} 외 ${remaining}명이 함께 반응했어요.`
    : `${namePart}이 함께 반응했어요.`
}
