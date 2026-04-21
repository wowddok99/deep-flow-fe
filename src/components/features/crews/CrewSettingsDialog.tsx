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
import { getApiErrorCode, getApiErrorMessage } from '@/lib/axios'
import { crewErrorMessage } from './crewErrorMessage'

interface Props {
  crew: CrewDetail
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CrewSettingsDialog({ crew, open, onOpenChange }: Props) {
  const [name, setName] = React.useState(crew.name)
  const [description, setDescription] = React.useState(crew.description ?? '')
  const [visibility, setVisibility] = React.useState<CrewVisibility>(crew.visibility)
  const [maxMembers, setMaxMembers] = React.useState<string>(crew.maxMembers?.toString() ?? '20')

  React.useEffect(() => {
    if (open) {
      setName(crew.name)
      setDescription(crew.description ?? '')
      setVisibility(crew.visibility)
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
    if (maxMembers.trim() === '') {
      toast.error('최대 인원을 입력해주세요')
      return
    }
    const n = Number(maxMembers)
    if (!Number.isInteger(n) || n < 2 || n > 500) {
      toast.error('최대 인원은 2~500명 사이여야 해요')
      return
    }
    const max: number = n

    try {
      await update.mutateAsync({
        name: trimmed,
        description: description.trim(),
        visibility,
        maxMembers: max as number,
      })
      toast.success('크루 정보를 수정했어요')
      onOpenChange(false)
    } catch (err) {
      const msg = crewErrorMessage(getApiErrorCode(err)) ?? getApiErrorMessage(err, '수정에 실패했습니다')
      toast.error(msg)
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
            <Input
              type="number"
              min={2}
              max={500}
              value={maxMembers}
              onChange={(e) => setMaxMembers(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">
              최대 500명까지 함께할 수 있어요
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
