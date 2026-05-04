"use client"

import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { crewsApi, crewKeys } from '@/lib/api'

export function useMyCrews() {
  return useQuery({
    queryKey: crewKeys.mine(),
    queryFn: crewsApi.listMine,
  })
}

export function useCrewDetail(crewId: number | null) {
  return useQuery({
    queryKey: crewId ? crewKeys.detail(crewId) : ['crews', 'detail', 'disabled'],
    queryFn: () => crewsApi.detail(crewId as number),
    enabled: !!crewId,
  })
}

export function useCrewActivity(crewId: number | null) {
  return useQuery({
    queryKey: crewId ? crewKeys.activity(crewId) : ['crews', 'activity', 'disabled'],
    queryFn: () => crewsApi.activity(crewId as number),
    enabled: !!crewId,
  })
}

export function useCrewSearch(q: string) {
  return useInfiniteQuery({
    queryKey: crewKeys.search(q),
    queryFn: ({ pageParam }) => crewsApi.search(q, pageParam as number | undefined),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (last) => (last.hasNext ? (last.nextCursorId ?? undefined) : undefined),
    enabled: q.length > 0,
  })
}
