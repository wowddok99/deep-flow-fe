"use client"

import { useRouter } from 'next/navigation'
import { Users } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CrewListHeader, CrewCard, JoinByCodeForm } from '@/components/features/crews'
import { useMyCrews } from '@/hooks/useCrews'

export default function CrewsPage() {
  const router = useRouter()
  const { data: crews, isLoading } = useMyCrews()

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <CrewListHeader />
        <JoinByCodeForm />

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
            <p className="text-sm text-muted-foreground mb-1">아직 참여한 크루가 없습니다</p>
            <p className="text-xs text-muted-foreground">
              새 크루를 만들거나 초대 코드로 참여하세요
            </p>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
