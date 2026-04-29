"use client"

import * as React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Send, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { commentApi, commentKeys, type CommentNode, type MemberSuggestion } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/axios'
import { useAuthStore } from '@/store/useAuthStore'
import { MentionAutocomplete } from './MentionAutocomplete'

interface CommentInputProps {
  sessionId: number
  crewId: number
  parentId?: number
  onSubmitted?: () => void
  onCancel?: () => void
  placeholder?: string
  autoFocus?: boolean
}

export function CommentInput({
  sessionId,
  crewId,
  parentId,
  onSubmitted,
  onCancel,
  placeholder = '댓글 작성... (@ 입력 시 멤버 자동완성)',
  autoFocus,
}: CommentInputProps) {
  const queryClient = useQueryClient()
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const [content, setContent] = React.useState('')
  const [mentionedIds, setMentionedIds] = React.useState<Set<number>>(new Set())

  // mention 자동완성 상태
  const [mentionQuery, setMentionQuery] = React.useState<string | null>(null)
  const mentionStartRef = React.useRef<number>(-1)

  React.useEffect(() => {
    if (autoFocus) textareaRef.current?.focus()
  }, [autoFocus])

  const detectMentionTrigger = (value: string, caret: number) => {
    // 캐럿 직전 '@' 찾기 — 단, 단어 시작 위치 (공백/줄 시작)
    const before = value.slice(0, caret)
    const at = before.lastIndexOf('@')
    if (at < 0) {
      setMentionQuery(null)
      mentionStartRef.current = -1
      return
    }
    // '@' 앞에 공백/줄시작이어야 함
    const charBefore = at === 0 ? ' ' : before[at - 1]
    if (!/\s/.test(charBefore) && at !== 0) {
      setMentionQuery(null)
      mentionStartRef.current = -1
      return
    }
    const queryStr = before.slice(at + 1)
    if (/\s/.test(queryStr)) {
      setMentionQuery(null)
      mentionStartRef.current = -1
      return
    }
    setMentionQuery(queryStr)
    mentionStartRef.current = at
  }

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value
    setContent(v)
    detectMentionTrigger(v, e.target.selectionStart ?? v.length)
  }

  const handleMentionSelect = (m: MemberSuggestion) => {
    const start = mentionStartRef.current
    if (start < 0) return
    // '@' + 입력했던 query 만큼을 정확히 잘라낸다.
    // selectionStart 는 dropdown 클릭/IME 조합 시점에 신뢰할 수 없어 사용 X.
    const queryLen = (mentionQuery ?? '').length
    const before = content.slice(0, start)
    const after = content.slice(start + 1 + queryLen)
    const replaced = `${before}@${m.username} ${after}`
    setContent(replaced)
    setMentionedIds((prev) => new Set(prev).add(m.userId))
    setMentionQuery(null)
    mentionStartRef.current = -1
    requestAnimationFrame(() => {
      const pos = before.length + m.username.length + 2 // '@' + username + ' '
      textareaRef.current?.focus()
      textareaRef.current?.setSelectionRange(pos, pos)
    })
  }

  const createMutation = useMutation({
    mutationFn: () =>
      commentApi.create(sessionId, {
        parentId,
        content: content.trim(),
        mentions: Array.from(mentionedIds),
      }),
    onMutate: async () => {
      // 낙관적 추가 — 서버 응답 전 임시 노드를 트리에 push.
      //
      // user.id 는 본인 id (useAuthStore) 를 그대로 사용해야 함.
      // CommentNodeView 의 권한 체크 (node.user.id === myId) 가 즉시 성립해
      // 본인이 막 작성한 댓글에 [수정][삭제] 버튼이 끊김/깜박임 없이 보임.
      // (가짜 -1 을 쓰면 onSettled invalidate 까지 수백 ms 동안 버튼 누락)
      //
      // user.name 은 BE 가 토큰/응답에 사용자 표시명을 안 보내 임시 라벨.
      // 어차피 onSettled invalidate 후 서버 응답으로 교체되므로 일시적.
      const myId = useAuthStore.getState().user?.id ?? -1
      const tmpId = -Date.now()
      const tmp: CommentNode = {
        id: tmpId,
        user: { id: myId, name: '나' },
        content: content.trim(),
        // 낙관적 단계에서는 mentions 를 비워둔다. onSettled invalidate 후 list 재조회로
        // 서버가 매핑한 정확한 멘션이 들어와 chip 강조가 켜진다.
        mentions: [],
        edited: false,
        deleted: false,
        createdAt: new Date().toISOString(),
        replies: [],
      }
      const prev = queryClient.getQueryData<CommentNode[]>(commentKeys.list(sessionId))
      queryClient.setQueryData<CommentNode[]>(commentKeys.list(sessionId), (old) => {
        const next = old ? [...old] : []
        if (parentId) {
          // 답글 — 부모 찾아 replies push
          return next.map((c) => addReplyToTree(c, parentId, tmp))
        }
        return [...next, tmp]
      })
      return { prev, tmpId }
    },
    onError: (err, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(commentKeys.list(sessionId), ctx.prev)
      toast.error(getApiErrorMessage(err, '댓글 작성에 실패했어요'))
    },
    onSuccess: () => {
      setContent('')
      setMentionedIds(new Set())
      setMentionQuery(null)
      onSubmitted?.()
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.list(sessionId) })
    },
  })

  const canSubmit = content.trim().length > 0 && !createMutation.isPending

  return (
    <div className="space-y-2 relative">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={onChange}
          placeholder={placeholder}
          rows={3}
          className="resize-none pr-1"
          onClick={(e) => detectMentionTrigger(content, (e.target as HTMLTextAreaElement).selectionStart ?? 0)}
          onKeyUp={(e) => {
            if (e.key === 'Escape') {
              setMentionQuery(null)
              mentionStartRef.current = -1
            } else {
              detectMentionTrigger(content, (e.target as HTMLTextAreaElement).selectionStart ?? 0)
            }
          }}
        />
        <MentionAutocomplete
          crewId={crewId}
          query={mentionQuery ?? ''}
          open={mentionQuery !== null}
          onSelect={handleMentionSelect}
          anchorRef={textareaRef}
        />
      </div>

      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel} className="cursor-pointer">
            <X className="h-3 w-3 mr-1" /> 취소
          </Button>
        )}
        <Button
          size="sm"
          onClick={() => createMutation.mutate()}
          disabled={!canSubmit}
          className="cursor-pointer"
        >
          <Send className="h-3 w-3 mr-1" /> 등록
        </Button>
      </div>
    </div>
  )
}

function addReplyToTree(node: CommentNode, parentId: number, reply: CommentNode): CommentNode {
  if (node.id === parentId) {
    return { ...node, replies: [...node.replies, reply] }
  }
  return { ...node, replies: node.replies.map((r) => addReplyToTree(r, parentId, reply)) }
}
