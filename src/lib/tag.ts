/**
 * 태그 정규화 (BE 정책 일치).
 * - lowercase
 * - 공백 → '-'
 * - 선두 '#' 제거
 * - 비-식별자 문자(공백/한글 자모 제외) 그대로 둠 — BE 가 길이 30자 제한 검증
 */
export function normalizeTag(input: string): string {
  let s = input.trim()
  if (s.startsWith('#')) s = s.slice(1)
  s = s.toLowerCase().replace(/\s+/g, '-')
  return s
}

export const MAX_TAG_LEN = 30
