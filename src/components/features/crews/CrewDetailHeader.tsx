"use client"

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button, buttonVariants } from '@/components/ui/button'
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
import { Settings, LogOut, Users, Send } from 'lucide-react'
import type { CrewDetail } from '@/lib/api'
import { useLeaveCrew, useDisbandCrew } from '@/hooks/useCrewMutations'
import { crewToastMessage } from './crewErrorMessage'
import { InviteCodeDialog } from './InviteCodeDialog'
import { CrewSettingsDialog } from './CrewSettingsDialog'

interface Props {
  crew: CrewDetail
}

export function CrewDetailHeader({ crew }: Props) {
  const router = useRouter()
  const [inviteOpen, setInviteOpen] = React.useState(false)
  const [settingsOpen, setSettingsOpen] = React.useState(false)

  const leave = useLeaveCrew()
  const disband = useDisbandCrew()

  const isOwner = crew.myRole === 'OWNER'

  const handleLeave = async () => {
    try {
      await leave.mutateAsync(crew.id)
      toast.success('크루에서 나왔어요')
      router.push('/app/crews')
    } catch (err) {
      toast.error(crewToastMessage(err, '나가기에 실패했습니다'))
    }
  }

  const handleDisband = async () => {
    try {
      await disband.mutateAsync(crew.id)
      toast.success('크루를 해체했어요')
      router.push('/app/crews')
    } catch (err) {
      toast.error(crewToastMessage(err, '해체에 실패했습니다'))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold truncate">{crew.name}</h1>
            <span
              className={`text-[10px] font-medium rounded-full px-2 py-0.5 ${
                crew.visibility === 'PUBLIC'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {crew.visibility === 'PUBLIC' ? '공개' : '비공개'}
            </span>
          </div>
          {crew.description && (
            <p className="text-sm text-muted-foreground mt-1.5">{crew.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              멤버 {crew.memberCount}/{crew.maxMembers ?? '∞'}
            </span>
            <span className="flex items-center gap-1 text-green-500">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              지금 {crew.activeNowCount}명 집중 중
            </span>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInviteOpen(true)}
            className="gap-1.5 cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
            초대하기
          </Button>

          {isOwner ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSettingsOpen(true)}
                className="gap-1.5 cursor-pointer"
              >
                <Settings className="h-3.5 w-3.5" />
                설정
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="cursor-pointer">
                    해체
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>크루를 해체할까요?</AlertDialogTitle>
                    <AlertDialogDescription>
                      모든 멤버가 크루에서 제거되고 복구할 수 없습니다.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDisband}
                      className={buttonVariants({ variant: 'destructive' })}
                    >
                      해체
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 cursor-pointer">
                  <LogOut className="h-3.5 w-3.5" />
                  나가기
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>크루에서 나갈까요?</AlertDialogTitle>
                  <AlertDialogDescription>언제든 초대 코드로 다시 참여할 수 있어요.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLeave}>나가기</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <InviteCodeDialog crew={crew} open={inviteOpen} onOpenChange={setInviteOpen} />
      {isOwner && (
        <CrewSettingsDialog crew={crew} open={settingsOpen} onOpenChange={setSettingsOpen} />
      )}
    </div>
  )
}
