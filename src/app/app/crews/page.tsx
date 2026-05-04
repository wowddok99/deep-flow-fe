"use client"

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Users, Search, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CrewListHeader, CrewCard, JoinByCodeForm } from '@/components/features/crews'
import { CreateCrewDialog } from '@/components/features/crews/CreateCrewDialog'
import { useMyCrews } from '@/hooks/useCrews'

export default function CrewsPage() {
  const router = useRouter()
  const { data: crews, isLoading } = useMyCrews()
  const [createOpen, setCreateOpen] = React.useState(false)

  const isEmpty = !isLoading && (!crews || crews.length === 0)

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <CrewListHeader />
        {/* 가입 사용자에게는 헤더 옆 작은 input 으로. 빈 상태 사용자에게는 빈 상태 컨테이너 안에 큰 form 으로. */}
        {!isEmpty && <JoinByCodeForm />}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-28 rounded-xl border border-border bg-card animate-pulse"
              />
            ))}
          </div>
        ) : crews && crews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {crews.map((crew) => (
              <CrewCard
                key={crew.id}
                crew={crew}
                onClick={() => router.push(`/app/crews/${crew.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-muted mb-4">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium mb-1">아직 참여한 크루가 없어요.</p>
            <p className="text-xs text-muted-foreground mb-5">
              어떻게 시작할까요?
            </p>

            <div className="flex gap-2 mb-6 flex-wrap justify-center">
              <Link href="/app/crews/search">
                <Button size="sm" className="gap-1.5 cursor-pointer">
                  <Search className="h-3.5 w-3.5" />
                  공개 크루 둘러보기
                </Button>
              </Link>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCreateOpen(true)}
                className="gap-1.5 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                새 크루 만들기
              </Button>
            </div>

            <div className="flex items-center gap-3 w-full max-w-sm mb-3">
              <span className="flex-1 h-px bg-border" />
              <span className="text-[11px] text-muted-foreground">또는 초대 코드로</span>
              <span className="flex-1 h-px bg-border" />
            </div>

            <div className="w-full max-w-sm flex justify-center">
              <JoinByCodeForm />
            </div>

            <CreateCrewDialog open={createOpen} onOpenChange={setCreateOpen} />
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
