"use client"

import { useParams, useRouter } from 'next/navigation'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import {
  CrewDetailHeader,
  CrewMemberList,
  CrewActivityCard,
} from '@/components/features/crews'
import { useCrewDetail } from '@/hooks/useCrews'
import { getApiErrorCode } from '@/lib/axios'
import { crewErrorMessage } from '@/components/features/crews'

export default function CrewDetailPage() {
  const params = useParams<{ crewId: string }>()
  const router = useRouter()
  const crewId = Number(params.crewId)
  const { data, isLoading, error } = useCrewDetail(Number.isFinite(crewId) ? crewId : null)

  if (error) {
    const code = getApiErrorCode(error)
    const msg = crewErrorMessage(code) ?? '크루 정보를 불러오지 못했어요'
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full gap-3">
        <p className="text-sm text-muted-foreground">{msg}</p>
        <Button variant="outline" size="sm" onClick={() => router.push('/app/crews')}>
          목록으로
        </Button>
      </div>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-20 rounded-xl border border-border bg-card animate-pulse" />
        <div className="h-40 rounded-xl border border-border bg-card animate-pulse" />
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/app/crews')}
          className="gap-1.5 cursor-pointer -ml-2 text-muted-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          목록으로
        </Button>

        <CrewDetailHeader crew={data} />
        <CrewMemberList crew={data} />
        <CrewActivityCard crewId={data.id} />
      </div>
    </ScrollArea>
  )
}
