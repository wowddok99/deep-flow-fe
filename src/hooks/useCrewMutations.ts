"use client"

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { crewsApi, crewKeys, type CreateCrewRequest, type UpdateCrewRequest, type InviteTtl } from '@/lib/api'

export function useCreateCrew() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateCrewRequest) => crewsApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: crewKeys.mine() }),
  })
}

export function useJoinByCode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => crewsApi.joinByCode(code),
    onSuccess: () => qc.invalidateQueries({ queryKey: crewKeys.mine() }),
  })
}

export function useJoinPublic() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (crewId: number) => crewsApi.joinPublic(crewId),
    onSuccess: () => qc.invalidateQueries({ queryKey: crewKeys.mine() }),
  })
}

export function useLeaveCrew() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (crewId: number) => crewsApi.leave(crewId),
    onSuccess: () => qc.invalidateQueries({ queryKey: crewKeys.mine() }),
  })
}

export function useDisbandCrew() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (crewId: number) => crewsApi.disband(crewId),
    onSuccess: () => qc.invalidateQueries({ queryKey: crewKeys.mine() }),
  })
}

export function useKickMember(crewId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) => crewsApi.kick(crewId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: crewKeys.detail(crewId) }),
  })
}

export function useIssueInviteCode(crewId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ttl: InviteTtl) => crewsApi.issueInviteCode(crewId, ttl),
    onSuccess: () => qc.invalidateQueries({ queryKey: crewKeys.detail(crewId) }),
  })
}

export function useUpdateCrew(crewId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateCrewRequest) => crewsApi.update(crewId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: crewKeys.detail(crewId) })
      qc.invalidateQueries({ queryKey: crewKeys.mine() })
    },
  })
}
