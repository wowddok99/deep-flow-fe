"use client"

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { tagApi, tagKeys } from '@/lib/api'
import { normalizeTag, MAX_TAG_LEN } from '@/lib/tag'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TagInputProps {
  crewId: number | null         // 크루 컨텍스트 (자동완성/인기 태그 출처). null 이면 자동완성 비활성
  value: string[]
  onChange: (tags: string[]) => void
  maxTags?: number
  placeholder?: string
  disabled?: boolean
  className?: string
}

const DEFAULT_MAX = 5
const SUGGESTION_LIMIT = 8

/**
 * 토스 스타일 태그 입력 — IDEA 13장.
 * - Pill 형태, 인라인 (모달 X)
 * - 입력 시 prefix 자동완성 (debounce 200ms)
 * - idle 시 "최근 사용" + "크루 인기" 분류
 * - Enter / `,` 로 추가, ✕ 로 제거
 */
export function TagInput({
  crewId,
  value,
  onChange,
  maxTags = DEFAULT_MAX,
  placeholder = '태그 입력...',
  disabled,
  className,
}: TagInputProps) {
  const [input, setInput] = React.useState('')
  const [debouncedInput, setDebouncedInput] = React.useState('')

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedInput(input), 200)
    return () => clearTimeout(t)
  }, [input])

  const isFull = value.length >= maxTags

  // 자동완성 (입력 있을 때)
  const { data: suggestions = [] } = useQuery({
    queryKey: crewId ? tagKeys.suggest(crewId, debouncedInput) : ['tags', 'suggest', 'noop'],
    queryFn: () => tagApi.suggest(crewId!, debouncedInput, SUGGESTION_LIMIT),
    enabled: !!crewId && debouncedInput.trim().length > 0,
    staleTime: 60 * 1000,
  })

  // idle 추천 - 본인 최근
  const { data: recentTags = [] } = useQuery({
    queryKey: tagKeys.recent,
    queryFn: () => tagApi.myRecent(SUGGESTION_LIMIT),
    enabled: !disabled,
    staleTime: 5 * 60 * 1000,
  })

  // idle 추천 - 크루 인기
  const { data: popularTags = [] } = useQuery({
    queryKey: crewId ? tagKeys.popular(crewId) : ['tags', 'popular', 'noop'],
    queryFn: () => tagApi.popular(crewId!, SUGGESTION_LIMIT),
    enabled: !!crewId && !disabled,
    staleTime: 5 * 60 * 1000,
  })

  const addTag = (raw: string) => {
    const normalized = normalizeTag(raw)
    if (!normalized) return
    if (normalized.length > MAX_TAG_LEN) return
    if (value.includes(normalized)) return
    if (value.length >= maxTags) return
    onChange([...value, normalized])
    setInput('')
  }

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag))
  }

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      if (input.trim()) addTag(input)
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  const showSuggestions = debouncedInput.trim().length > 0
  const inputNormalized = normalizeTag(input)
  const isNew = showSuggestions
    && inputNormalized.length > 0
    && !suggestions.some((s) => s.tag === inputNormalized)
    && !value.includes(inputNormalized)

  return (
    <div className={cn('w-full', className)}>
      {/* Pill row + input */}
      <div className={cn(
        'flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 min-h-9',
        'focus-within:ring-1 focus-within:ring-ring',
        disabled && 'opacity-60 pointer-events-none'
      )}>
        {value.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-full bg-secondary text-secondary-foreground px-2 py-0.5 text-xs"
          >
            {t}
            <button
              type="button"
              onClick={() => removeTag(t)}
              className="hover:text-destructive transition-colors cursor-pointer"
              aria-label={`${t} 제거`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {!isFull && (
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={value.length === 0 ? placeholder : ''}
            disabled={disabled}
            className="flex-1 min-w-[80px] bg-transparent outline-none text-sm py-0.5"
          />
        )}
        {isFull && (
          <span className="text-[11px] text-muted-foreground">최대 {maxTags}개</span>
        )}
      </div>

      {/* Suggestions / Recommendations */}
      {!disabled && (showSuggestions ? (
        <div className="mt-2 space-y-1">
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {suggestions.map((s) => (
                <button
                  type="button"
                  key={s.tag}
                  onClick={() => addTag(s.tag)}
                  disabled={isFull || value.includes(s.tag)}
                  className={cn(
                    'rounded-full bg-secondary/60 hover:bg-secondary text-secondary-foreground px-2 py-0.5 text-xs cursor-pointer',
                    value.includes(s.tag) && 'opacity-40 cursor-not-allowed',
                  )}
                >
                  {s.tag}
                </button>
              ))}
            </div>
          )}
          {isNew && !isFull && (
            <button
              type="button"
              onClick={() => addTag(input)}
              className="text-xs text-primary hover:underline cursor-pointer"
            >
              + &quot;{inputNormalized}&quot; 새로 추가
            </button>
          )}
        </div>
      ) : (
        <div className="mt-2 space-y-1.5 text-[11px]">
          {recentTags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-muted-foreground">⏱ 최근 사용</span>
              <span className="text-muted-foreground/40">·</span>
              <div className="flex flex-wrap gap-1">
                {recentTags.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => addTag(t)}
                    disabled={isFull || value.includes(t)}
                    className={cn(
                      'rounded-full bg-secondary/60 hover:bg-secondary px-1.5 py-px cursor-pointer',
                      value.includes(t) && 'opacity-40 cursor-not-allowed',
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
          {popularTags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-muted-foreground">🔥 우리 크루 인기</span>
              <span className="text-muted-foreground/40">·</span>
              <div className="flex flex-wrap gap-1">
                {popularTags.map((p) => (
                  <button
                    key={p.tag}
                    type="button"
                    onClick={() => addTag(p.tag)}
                    disabled={isFull || value.includes(p.tag)}
                    className={cn(
                      'rounded-full bg-secondary/60 hover:bg-secondary px-1.5 py-px cursor-pointer',
                      value.includes(p.tag) && 'opacity-40 cursor-not-allowed',
                    )}
                  >
                    {p.tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
