"use client"

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { LogIn } from 'lucide-react'
import { useJoinByCode } from '@/hooks/useCrewMutations'
import { crewToastMessage } from './crewErrorMessage'

export function JoinByCodeForm() {
  const router = useRouter()
  const [code, setCode] = React.useState('')
  const joinByCode = useJoinByCode()

  const submit = async () => {
    const value = code.trim()
    if (!value) {
      toast.error('초대 코드를 입력해주세요')
      return
    }
    try {
      const crew = await joinByCode.mutateAsync(value.toUpperCase())
      toast.success(`${crew.name} 에 참여했어요`)
      setCode('')
      router.push(`/app/crews/${crew.id}`)
    } catch (err) {
      toast.error(crewToastMessage(err, '참여에 실패했습니다'))
    }
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <Input
        placeholder="초대 코드 입력"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        className="min-w-[140px] max-w-[200px] uppercase"
      />
      <Button
        variant="outline"
        size="sm"
        onClick={submit}
        disabled={joinByCode.isPending}
        className="gap-1.5 cursor-pointer flex-shrink-0"
      >
        <LogIn className="h-3.5 w-3.5" />
        참여
      </Button>
    </div>
  )
}
