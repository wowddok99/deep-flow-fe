"use client"

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { commentApi, commentKeys } from '@/lib/api'
import { CommentNodeView } from './CommentNode'
import { CommentInput } from './CommentInput'

interface CommentThreadProps {
  sessionId: number
  crewId: number
  highlightCommentId?: number | null
}

export function CommentThread({ sessionId, crewId, highlightCommentId }: CommentThreadProps) {
  const { data: comments = [], isLoading } = useQuery({
    queryKey: commentKeys.list(sessionId),
    queryFn: () => commentApi.list(sessionId),
  })

  const totalCount = comments.reduce(
    (acc, c) => acc + (c.deleted ? 0 : 1) + c.replies.length,
    0
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold">💬 댓글 {totalCount}</h3>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && comments.length === 0 && (
        <p className="text-xs text-muted-foreground py-4 text-center">첫 댓글을 남겨보세요</p>
      )}

      <div className="space-y-3">
        {comments.map((c) => (
          <CommentNodeView
            key={c.id}
            node={c}
            sessionId={sessionId}
            crewId={crewId}
            highlightCommentId={highlightCommentId}
          />
        ))}
      </div>

      <div className="pt-2 border-t border-border/50">
        <CommentInput sessionId={sessionId} crewId={crewId} />
      </div>
    </div>
  )
}
