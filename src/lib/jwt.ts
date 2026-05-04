// JWT payload 디코드 — 권한 체크용 (서명 검증은 BE 에서). 표준 base64url.
// 댓글 수정/삭제 권한 체크 등에서 본인 userId 가 필요한데
// 백엔드가 별도 me 엔드포인트를 제공하지 않아서 토큰에서 추출.

interface JwtPayload {
  sub?: string | number
  userId?: number
  username?: string
  exp?: number
  iat?: number
  [key: string]: unknown
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = payload + '='.repeat((4 - payload.length % 4) % 4)
    const json = atob(padded)
    return JSON.parse(json) as JwtPayload
  } catch {
    return null
  }
}

/** 토큰에서 userId 추출. sub 가 숫자형 또는 userId 클레임 둘 다 시도. */
export function extractUserIdFromToken(token: string | null): number | null {
  if (!token) return null
  const payload = decodeJwt(token)
  if (!payload) return null
  if (typeof payload.userId === 'number') return payload.userId
  if (typeof payload.sub === 'number') return payload.sub
  if (typeof payload.sub === 'string') {
    const n = Number(payload.sub)
    if (Number.isFinite(n)) return n
  }
  return null
}
