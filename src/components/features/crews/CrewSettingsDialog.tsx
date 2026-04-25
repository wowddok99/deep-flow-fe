"use client"

import * as React from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { CrewDetail, CrewVisibility } from '@/lib/api'
import { useUpdateCrew } from '@/hooks/useCrewMutations'
import { crewToastMessage } from './crewErrorMessage'

interface Props {
  crew: CrewDetail
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CrewSettingsDialog({ crew, open, onOpenChange }: Props) {
  const [name, setName] = React.useState(crew.name)
  const [description, setDescription] = React.useState(crew.description ?? '')
  const [visibility, setVisibility] = React.useState<CrewVisibility>(crew.visibility)
  const [unlimited, setUnlimited] = React.useState(crew.maxMembers == null)
  const [maxMembers, setMaxMembers] = React.useState<string>(crew.maxMembers?.toString() ?? '20')

  React.useEffect(() => {
    if (open) {
      setName(crew.name)
      setDescription(crew.description ?? '')
      setVisibility(crew.visibility)
      setUnlimited(crew.maxMembers == null)
      setMaxMembers(crew.maxMembers?.toString() ?? '20')
    }
  }, [open, crew])

  const update = useUpdateCrew(crew.id)

  const submit = async () => {
    const trimmed = name.trim()
    if (!trimmed || trimmed.length > 30) {
      toast.error('이름은 1~30자로 입력해주세요')
      return
    }

    let max: number | null
    if (unlimited) {
      max = null
    } else {
      if (maxMembers.trim() === '') {
        toast.error('최대 인원을 입력해주세요')
        return
      }
      const n = Number(maxMembers)
      if (!Number.isInteger(n) || n < 2 || n > 500) {
        toast.error('최대 인원은 2~500명 사이여야 해요')
        return
      }
      max = n
    }

    // PUT 시맨틱: 받은 crew 객체를 베이스로, 수정한 필드만 덮어써서 전체 전송.
    try {
      await update.mutateAsync({
        name: trimmed,
        description: description.trim() || null,
        visibility,
        maxMembers: max,
      })
      toast.success('크루 정보를 수정했어요')
      onOpenChange(false)
    } catch (err) {
      toast.error(crewToastMessage(err, '수정에 실패했습니다'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>크루 설정</DialogTitle>
          <DialogDescription>리더만 변경할 수 있어요.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <label className="text-xs font-medium">이름 *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={30} />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs font-medium">설명</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs font-medium">공개 여부</label>
            <div className="flex gap-2">
              {(['PRIVATE', 'PUBLIC'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVisibility(v)}
                  className={`flex-1 text-xs py-2 rounded-md border cursor-pointer ${
                    visibility === v
                      ? 'bg-secondary border-foreground/30 text-foreground'
                      : 'bg-background border-border text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  {v === 'PRIVATE' ? '비공개' : '공개'}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs font-medium">최대 인원</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setUnlimited(false)}
                className={`flex-1 text-xs py-2 rounded-md border cursor-pointer ${
                  !unlimited
                    ? 'bg-secondary border-foreground/30 text-foreground'
                    : 'bg-background border-border text-muted-foreground hover:bg-muted/50'
                }`}
              >
                인원 지정
              </button>
              <button
                type="button"
                onClick={() => setUnlimited(true)}
                className={`flex-1 text-xs py-2 rounded-md border cursor-pointer ${
                  unlimited
                    ? 'bg-secondary border-foreground/30 text-foreground'
                    : 'bg-background border-border text-muted-foreground hover:bg-muted/50'
                }`}
              >
                무제한
              </button>
            </div>
            {!unlimited && (
              <Input
                type="number"
                min={2}
                max={500}
                value={maxMembers}
                onChange={(e) => setMaxMembers(e.target.value)}
              />
            )}
            <p className="text-[11px] text-muted-foreground">
              {unlimited ? '인원 제한 없이 누구나 참여할 수 있어요' : '최대 500명까지 함께할 수 있어요'}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="cursor-pointer">취소</Button>
          <Button onClick={submit} disabled={update.isPending} className="cursor-pointer">
            {update.isPending ? '저장 중...' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
