"use client"

import * as React from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Copy, RotateCw } from 'lucide-react'
import type { CrewDetail, InviteTtl } from '@/lib/api'
import { useIssueInviteCode } from '@/hooks/useCrewMutations'
import { crewToastMessage } from './crewErrorMessage'

interface Props {
  crew: CrewDetail
  open: boolean
  onOpenChange: (open: boolean) => void
}

const TTL_OPTIONS: { label: string; value: InviteTtl }[] = [
  { label: '5분', value: 5 },
  { label: '30분', value: 30 },
  { label: '1시간', value: 60 },
  { label: '24시간', value: 1440 },
]

function formatCountdown(secondsLeft: number): string {
  if (secondsLeft <= 0) return '만료됨'
  const h = Math.floor(secondsLeft / 3600)
  const m = Math.floor((secondsLeft % 3600) / 60)
  const s = secondsLeft % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`
  return `${pad(m)}:${pad(s)}`
}

export function InviteCodeDialog({ crew, open, onOpenChange }: Props) {
  const issue = useIssueInviteCode(crew.id)
  const [now, setNow] = React.useState(() => Date.now())
  const [lastTtl, setLastTtl] = React.useState<InviteTtl>(30)

  // 카운트다운 보정용: 응답 수신 시각을 기준으로 잔여 초를 계산해 클라이언트 시계 어긋남 영향을 제거.
  const fetchedAtRef = React.useRef<number>(Date.now())
  React.useEffect(() => {
    if (crew.inviteCode) fetchedAtRef.current = Date.now()
  }, [crew.inviteCode])

  React.useEffect(() => {
    if (!open) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [open])

  const totalSecondsAtFetch = crew.inviteCodeExpiresAt
    ? Math.floor(
        (new Date(crew.inviteCodeExpiresAt).getTime() - fetchedAtRef.current) / 1000
      )
    : 0
  const elapsed = Math.floor((now - fetchedAtRef.current) / 1000)
  const secondsLeft = Math.max(0, totalSecondsAtFetch - elapsed)
  const isValid = Boolean(crew.inviteCode && secondsLeft > 0)

  const handleIssue = async (ttl: InviteTtl) => {
    setLastTtl(ttl)
    try {
      await issue.mutateAsync(ttl)
      toast.success('초대 코드를 발급했어요')
    } catch (err) {
      toast.error(crewToastMessage(err, '코드 발급에 실패했습니다'))
    }
  }

  const handleCopy = async () => {
    if (!crew.inviteCode) return
    try {
      await navigator.clipboard.writeText(crew.inviteCode)
      toast.success('초대 코드를 복사했어요')
    } catch {
      toast.error('복사에 실패했습니다')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>크루 초대</DialogTitle>
          <DialogDescription>초대 코드의 유효 시간을 선택하고 공유하세요.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-4 gap-2">
            {TTL_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant="outline"
                size="sm"
                disabled={issue.isPending}
                onClick={() => handleIssue(opt.value)}
                className="cursor-pointer"
              >
                {opt.label}
              </Button>
            ))}
          </div>

          {isValid ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/40">
                <input
                  readOnly
                  value={crew.inviteCode ?? ''}
                  className="flex-1 bg-transparent text-xl font-mono tracking-[0.3em] text-center outline-none"
                />
                <Button variant="ghost" size="sm" onClick={handleCopy} className="cursor-pointer">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div
                aria-live="polite"
                className="flex items-center justify-between text-xs text-muted-foreground"
              >
                <span>⏱ {formatCountdown(secondsLeft)} 후 만료</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleIssue(lastTtl)}
                  disabled={issue.isPending}
                  className="gap-1.5 cursor-pointer"
                >
                  <RotateCw className="h-3 w-3" />
                  새로 발급
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-lg border border-dashed border-border bg-muted/20 text-center text-sm text-muted-foreground">
              유효 시간을 선택해 새 초대 코드를 발급하세요
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
