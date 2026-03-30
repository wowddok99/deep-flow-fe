"use client"

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GroupCard } from '@/components/features/groups/GroupCard'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Users, LogIn } from 'lucide-react'
import { mockGroups } from '@/lib/mock-data'

export default function GroupsPage() {
  const [inviteCode, setInviteCode] = React.useState('')
  const groups = mockGroups

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h1 className="text-lg font-bold">그룹</h1>
          <Button size="sm" className="gap-1.5 cursor-pointer flex-shrink-0">
            <Plus className="h-4 w-4" />
            새 그룹
          </Button>
        </div>

        {/* 초대 코드 참여 */}
        <div className="flex gap-2 flex-wrap">
          <Input
            placeholder="초대 코드 입력"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            className="min-w-[140px] max-w-[200px]"
          />
          <Button variant="outline" size="sm" className="gap-1.5 cursor-pointer flex-shrink-0">
            <LogIn className="h-3.5 w-3.5" />
            참여
          </Button>
        </div>

        {/* 그룹 목록 */}
        {groups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {groups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-muted mb-4">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">아직 참여한 그룹이 없습니다</p>
            <p className="text-xs text-muted-foreground">새 그룹을 만들거나 초대 코드로 참여하세요</p>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
