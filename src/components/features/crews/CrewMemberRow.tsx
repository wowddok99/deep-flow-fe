"use client"

import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button, buttonVariants } from '@/components/ui/button'
import { UserX } from 'lucide-react'
import type { CrewMemberInfo } from '@/lib/api'
import { useKickMember } from '@/hooks/useCrewMutations'
import { crewToastMessage } from './crewErrorMessage'

interface Props {
  member: CrewMemberInfo
  crewId: number
  canKick: boolean
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}.${m}.${day}`
}

function initials(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?'
}

export function CrewMemberRow({ member, crewId, canKick }: Props) {
  const kick = useKickMember(crewId)

  const handleKick = async () => {
    try {
      await kick.mutateAsync(member.userId)
      toast.success(`${member.name} 님을 추방했어요`)
    } catch (err) {
      toast.error(crewToastMessage(err, '추방에 실패했습니다'))
    }
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/40 transition-colors">
      <div className="flex items-center justify-center h-9 w-9 rounded-full bg-muted text-muted-foreground text-xs font-medium flex-shrink-0">
        {initials(member.name)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium truncate">{member.name}</span>
          {member.role === 'OWNER' && (
            <span className="text-[9px] font-medium bg-primary/10 text-primary rounded-full px-1.5 py-0.5">
              리더
            </span>
          )}
          {member.isActiveNow && (
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" aria-label="지금 집중 중" />
          )}
        </div>
        <div className="text-[10px] text-muted-foreground mt-0.5">
          가입일 {formatDate(member.joinedAt)}
        </div>
      </div>

      {canKick && member.role !== 'OWNER' && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="cursor-pointer text-destructive hover:text-destructive">
              <UserX className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{member.name} 님을 추방할까요?</AlertDialogTitle>
              <AlertDialogDescription>추방된 멤버는 다시 초대 코드로 참여할 수 있어요.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleKick}
                className={buttonVariants({ variant: 'destructive' })}
              >
                추방
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
