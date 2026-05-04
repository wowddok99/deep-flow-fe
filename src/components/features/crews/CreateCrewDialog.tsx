"use client"

import * as React from 'react'
import { useRouter } from 'next/navigation'
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
import { useCreateCrew } from '@/hooks/useCrewMutations'
import type { CrewVisibility } from '@/lib/api'
import { crewToastMessage } from './crewErrorMessage'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateCrewDialog({ open, onOpenChange }: Props) {
  const router = useRouter()
  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [visibility, setVisibility] = React.useState<CrewVisibility>('PRIVATE')
  const [unlimited, setUnlimited] = React.useState(false)
  const [maxMembers, setMaxMembers] = React.useState<string>('20')

  const createCrew = useCreateCrew()

  const reset = () => {
    setName('')
    setDescription('')
    setVisibility('PRIVATE')
    setUnlimited(false)
    setMaxMembers('20')
  }

  const submit = async () => {
    const trimmed = name.trim()
    if (!trimmed || trimmed.length > 30) {
      toast.error('크루 이름은 1~30자로 입력해주세요')
      return
    }
    if (description.length > 200) {
      toast.error('설명은 200자 이내로 입력해주세요')
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

    try {
      const crew = await createCrew.mutateAsync({
        name: trimmed,
        description: description.trim() || undefined,
        visibility,
        maxMembers: max,
      })
      toast.success('크루를 생성했습니다')
      onOpenChange(false)
      reset()
      router.push(`/app/crews/${crew.id}`)
    } catch (err) {
      toast.error(crewToastMessage(err, '크루 생성에 실패했습니다'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>새 크루 만들기</DialogTitle>
          <DialogDescription>함께 집중할 동료를 모을 크루를 만들어보세요.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <label className="text-xs font-medium">이름 *</label>
            <Input
              placeholder="예: 개발 스터디"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs font-medium">설명</label>
            <Textarea
              placeholder="간단한 크루 소개"
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
          <Button onClick={submit} disabled={createCrew.isPending} className="cursor-pointer">
            {createCrew.isPending ? '생성 중...' : '만들기'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
