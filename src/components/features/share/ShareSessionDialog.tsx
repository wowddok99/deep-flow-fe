"use client"

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, ChevronDown } from 'lucide-react'
import { TagInput } from '@/components/features/tags/TagInput'
import { crewsApi, crewKeys, shareApi, feedKeys, type CrewSummary } from '@/lib/api'
import { getApiErrorCode, getApiErrorMessage } from '@/lib/axios'

interface ShareSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionId: number
  defaultCrewId?: number | null
  onShared?: () => void
}

const ERROR_CARRIES: Record<string, string> = {
  SESSION_ALREADY_SHARED: '이미 공유된 세션입니다',
  SESSION_NOT_SHAREABLE: '세션 본문이 비어있거나 완료 상태가 아니에요',
  NOT_CREW_MEMBER: '이 크루의 멤버가 아니에요',
  TAG_LIMIT_EXCEEDED: '태그는 최대 5개까지 가능해요',
}

export function ShareSessionDialog({
  open,
  onOpenChange,
  sessionId,
  defaultCrewId,
  onShared,
}: ShareSessionDialogProps) {
  const queryClient = useQueryClient()
  const [selectedCrewId, setSelectedCrewId] = React.useState<number | null>(defaultCrewId ?? null)
  const [tags, setTags] = React.useState<string[]>([])

  const { data: crews = [], isLoading: crewsLoading } = useQuery({
    queryKey: crewKeys.mine(),
    queryFn: () => crewsApi.listMine(),
    enabled: open,
  })

  // 다이얼로그 열릴 때 기본 크루 선택.
  // 가입 크루가 1개거나 호출부에서 명시한 defaultCrewId 가 있으면 자동 선택.
  // 2개 이상이면 사용자가 직접 고르게 둠 — 의도와 다른 크루로 발행되는 사고 방지.
  React.useEffect(() => {
    if (!open) return
    if (selectedCrewId !== null) return
    if (defaultCrewId) {
      setSelectedCrewId(defaultCrewId)
    } else if (crews.length === 1) {
      setSelectedCrewId(crews[0].id)
    }
  }, [open, crews, defaultCrewId, selectedCrewId])

  // 닫힐 때 상태 리셋
  React.useEffect(() => {
    if (!open) {
      setTags([])
      setSelectedCrewId(defaultCrewId ?? null)
    }
  }, [open, defaultCrewId])

  const shareMutation = useMutation({
    mutationFn: () => shareApi.share(sessionId, { crewId: selectedCrewId!, tags }),
    onSuccess: () => {
      toast.success('크루에 공유했어요')
      queryClient.invalidateQueries({ queryKey: feedKeys.list(selectedCrewId!) })
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      onShared?.()
      onOpenChange(false)
    },
    onError: (e) => {
      const code = getApiErrorCode(e)
      const msg = (code && ERROR_CARRIES[code]) ?? getApiErrorMessage(e, '공유에 실패했어요')
      toast.error(msg)
    },
  })

  const canSubmit = !!selectedCrewId && !shareMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>크루에 공유</DialogTitle>
          <DialogDescription className="text-xs">
            이 세션을 크루 피드에 올리면 멤버들이 댓글과 리액션을 남길 수 있어요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 크루 선택 */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">크루</label>
            {crewsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> 크루 목록 불러오는 중
              </div>
            ) : crews.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                먼저 크루에 가입해야 공유할 수 있어요.
              </p>
            ) : (
              <CrewSelectDropdown
                crews={crews}
                selectedId={selectedCrewId}
                onChange={setSelectedCrewId}
              />
            )}
          </div>

          {/* 태그 */}
          {selectedCrewId && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                태그 <span className="text-muted-foreground/60">(선택, 최대 5개)</span>
              </label>
              <TagInput
                crewId={selectedCrewId}
                value={tags}
                onChange={setTags}
                placeholder="ex) spring, jpa"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={shareMutation.isPending}
            className="cursor-pointer"
          >
            취소
          </Button>
          <Button
            onClick={() => shareMutation.mutate()}
            disabled={!canSubmit}
            className="cursor-pointer"
          >
            {shareMutation.isPending ? (
              <><Loader2 className="h-3 w-3 animate-spin mr-1" /> 공유 중</>
            ) : '공유하기'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface CrewSelectProps {
  crews: CrewSummary[]
  selectedId: number | null
  onChange: (id: number) => void
}

function CrewSelectDropdown({ crews, selectedId, onChange }: CrewSelectProps) {
  if (crews.length === 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-input bg-secondary/30">
        <span className="text-sm font-medium">{crews[0].name}</span>
        <span className="text-[10px] text-muted-foreground">멤버 {crews[0].memberCount}</span>
      </div>
    )
  }
  // native select 의 브라우저별 chevron 변동성 회피 — appearance-none + lucide ChevronDown 직접 배치.
  // 미선택 placeholder 옵션을 두어 사용자가 명시적으로 크루를 고르도록 강제.
  return (
    <div className="relative">
      <select
        value={selectedId ?? ''}
        onChange={(e) => {
          const v = e.target.value
          if (v === '') return
          onChange(Number(v))
        }}
        className="w-full h-9 pl-3 pr-9 rounded-md border border-input bg-background text-sm cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring appearance-none"
      >
        <option value="" disabled>크루를 선택하세요</option>
        {crews.map((c) => (
          <option key={c.id} value={c.id}>{c.name} (멤버 {c.memberCount})</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    </div>
  )
}
