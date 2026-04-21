"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RTooltip,
  CartesianGrid,
} from 'recharts'
import { useCrewActivity } from '@/hooks/useCrews'

interface Props {
  crewId: number
}

function formatHourMin(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h === 0) return `${m}분`
  return `${h}시간 ${m}분`
}

function formatMd(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function formatMinutesLabel(minutes: number): string {
  if (minutes < 60) return `${minutes}분`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`
}

interface TooltipPayload {
  value: number
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-md border border-border bg-popover px-2.5 py-1.5 shadow-md text-xs">
      <div className="font-medium text-foreground">{label}</div>
      <div className="text-muted-foreground mt-0.5">
        {formatMinutesLabel(payload[0].value)}
      </div>
    </div>
  )
}

export function CrewActivityCard({ crewId }: Props) {
  const { data, isLoading } = useCrewActivity(crewId)

  if (isLoading || !data) {
    return (
      <div className="p-4 rounded-xl border border-border bg-card">
        <div className="h-32 animate-pulse bg-muted/30 rounded-md" />
      </div>
    )
  }

  const chartData = data.weeklyTrend.map((p) => ({
    date: formatMd(p.date),
    minutes: Math.round(p.totalDurationSeconds / 60),
  }))

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold">크루 활동</h2>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="지금 집중 중" value={`${data.activeNowCount}명`} />
        <Stat label="오늘 참여" value={`${data.todayParticipantCount}명`} />
        <Stat label="오늘 합산" value={formatHourMin(data.todayTotalDurationSeconds)} />
      </div>

      <div className="p-4 rounded-xl border border-border bg-card">
        <h3 className="text-xs font-medium text-muted-foreground mb-3">최근 7일 집중 추세 (분)</h3>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <RTooltip
                content={<ChartTooltip />}
                cursor={{ stroke: 'currentColor', strokeOpacity: 0.15 }}
              />
              <Line type="monotone" dataKey="minutes" stroke="currentColor" className="text-primary" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-border bg-card">
        <h3 className="text-xs font-medium text-muted-foreground mb-3">오늘의 Top 멤버</h3>
        {data.memberRanking.length > 0 ? (
          <div className="space-y-2">
            {data.memberRanking.map((r, idx) => (
              <div key={r.userId} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <span className="w-4 text-muted-foreground">{idx + 1}</span>
                  <span className="font-medium">{r.name}</span>
                </span>
                <span className="text-muted-foreground">{formatHourMin(r.totalDurationSeconds)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground py-2">
            오늘은 아직 완료된 세션이 없어요
          </p>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl border border-border bg-card">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold mt-0.5">{value}</div>
    </div>
  )
}
