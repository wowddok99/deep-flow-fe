"use client"

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { mentionApi, mentionKeys, type MemberSuggestion } from '@/lib/api'
import { cn } from '@/lib/utils'

interface MentionAutocompleteProps {
  crewId: number
  query: string                                  // '@' 다음 입력 prefix (정규화된 형태)
  onSelect: (member: MemberSuggestion) => void
  open: boolean
  // textarea 또는 Tiptap contentEditable 등 keydown 을 받을 수 있는 요소
  anchorRef: React.RefObject<HTMLElement | null>
}

/**
 * 댓글 입력창의 '@' prefix 매칭 자동완성 popover.
 * 키보드 ↑↓ 선택 + Enter / Tab 으로 확정, Esc 닫힘.
 */
export function MentionAutocomplete({ crewId, query, onSelect, open, anchorRef }: MentionAutocompleteProps) {
  const [hi, setHi] = React.useState(0)

  const { data: items = [] } = useQuery({
    queryKey: mentionKeys.suggest(crewId, query),
    queryFn: () => mentionApi.suggest(crewId, query, 8),
    enabled: open && query.trim().length > 0,
    staleTime: 30 * 1000,
  })

  React.useEffect(() => { setHi(0) }, [items.length])

  // 키보드 핸들러를 부모 textarea 에 부착
  React.useEffect(() => {
    if (!open) return
    const el = anchorRef.current
    if (!el) return

    const handler = (e: KeyboardEvent) => {
      if (!open || items.length === 0) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHi((h) => (h + 1) % items.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHi((h) => (h - 1 + items.length) % items.length)
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        // 한글 IME 조합 중인 Enter 는 IME commit 신호로 먼저 동작하므로
        // 이 시점의 doc 은 아직 조합문자(예: '최') 미반영 상태.
        // compositionend 까지 기다려 doc 이 안정된 후 선택을 적용하면
        // command 의 range.to 가 정확해 chip 뒤 잔재 텍스트가 남지 않는다.
        if (e.isComposing) {
          const target = items[hi]
          const onceCompositionEnd = () => onSelect(target)
          el.addEventListener('compositionend', onceCompositionEnd, { once: true })
        } else {
          onSelect(items[hi])
        }
      }
    }
    // capture phase 로 부착해 contentEditable 의 ProseMirror 내부 핸들러보다 먼저 실행되도록 보장.
    // textarea 케이스에서도 동일하게 동작하므로 기존 호환 유지.
    el.addEventListener('keydown', handler, true)
    return () => el.removeEventListener('keydown', handler, true)
  }, [open, items, hi, anchorRef, onSelect])

  if (!open) return null

  return (
    <div className="absolute left-0 bottom-full mb-1 z-50 w-64 rounded-md border border-border bg-popover shadow-md text-popover-foreground overflow-hidden">
      {items.length === 0 ? (
        <div className="px-3 py-2 text-xs text-muted-foreground">추천 멤버 없음</div>
      ) : (
        <ul className="py-1">
          {items.map((m, i) => (
            <li key={m.userId}>
              <button
                type="button"
                // onClick 대신 onMouseDown + preventDefault: 에디터의 포커스/IME 상태가
                // 클릭 직전에 흐트러지지 않도록 해, 한글 조합 commit 후 command 가
                // 안정된 doc 상태로 실행되게 한다.
                onMouseDown={(e) => {
                  e.preventDefault()
                  onSelect(m)
                }}
                onMouseEnter={() => setHi(i)}
                className={cn(
                  'w-full text-left px-3 py-1.5 text-sm cursor-pointer transition-colors',
                  i === hi ? 'bg-secondary text-foreground' : 'hover:bg-secondary/40'
                )}
              >
                <span className="font-medium">@{m.username}</span>
                <span className="text-muted-foreground text-xs ml-2">({m.name})</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
