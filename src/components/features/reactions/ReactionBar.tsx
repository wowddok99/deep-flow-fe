"use client"

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reactionApi, reactionKeys, REACTION_EMOJIS, type ReactionAggregate } from '@/lib/api'
import { cn } from '@/lib/utils'

interface ReactionBarProps {
  sessionId: number
}

export function ReactionBar({ sessionId }: ReactionBarProps) {
  const queryClient = useQueryClient()

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
        const idx = items.findIndex((it) => it.emoji === emoji)
        if (idx === -1) {
          return { items: [...items, { emoji, count: 1, userReacted: true }] }
        }
        const target = items[idx]
        const next = target.userReacted
          ? { ...target, count: Math.max(0, target.count - 1), userReacted: false }
          : { ...target, count: target.count + 1, userReacted: true }
        return { items: items.map((it, i) => (i === idx ? next : it)) }
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
  const itemMap = new Map(items.map((it) => [it.emoji, it]))

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {REACTION_EMOJIS.map((emoji) => {
        const it = itemMap.get(emoji)
        const count = it?.count ?? 0
        const reacted = !!it?.userReacted
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => toggleMutation.mutate(emoji)}
            disabled={isLoading}
            className={cn(
              'inline-flex items-center justify-center gap-1 rounded-md px-2.5 py-1 text-sm transition-colors cursor-pointer border min-w-[3.25rem]',
              reacted
                ? 'bg-foreground/10 border-foreground/25 text-foreground'
                : 'bg-muted/50 border-transparent hover:bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            <span className="leading-none">{emoji}</span>
            <span className="text-xs tabular-nums">{count}</span>
          </button>
        )
      })}
    </div>
  )
}
