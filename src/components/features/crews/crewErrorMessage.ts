import { getApiErrorCode, getApiErrorMessage } from '@/lib/axios'

const MAP: Record<string, string> = {
  INVALID_INVITE_CODE: '유효하지 않거나 만료된 코드예요',
  CREW_MEMBER_LIMIT_EXCEEDED: '크루 인원이 가득 찼어요',
  ALREADY_CREW_MEMBER: '이미 참여한 크루예요',
  CREW_OWNER_CANNOT_LEAVE: '리더는 나갈 수 없어요. 크루를 해체하세요',
  CREW_ACCESS_DENIED: '권한이 없어요',
  NOT_CREW_MEMBER: '크루원만 접근할 수 있어요',
  CREW_MAX_MEMBERS_BELOW_CURRENT: '현재 인원보다 적게 설정할 수 없어요',
  CREW_NOT_PUBLIC: '비공개 크루는 초대 코드로만 참여할 수 있어요',
  INVALID_INVITE_TTL: '유효하지 않은 만료 시간이에요',
  CREW_NOT_FOUND: '크루를 찾을 수 없어요',
}

export function crewErrorMessage(code: string | null): string | null {
  if (!code) return null
  return MAP[code] ?? null
}

/** crew 도메인 에러용 toast 메시지 헬퍼 — 에러 코드 매핑 → 백엔드 메시지 → fallback 순으로 반환 */
export function crewToastMessage(err: unknown, fallback: string): string {
  return crewErrorMessage(getApiErrorCode(err)) ?? getApiErrorMessage(err, fallback)
}
