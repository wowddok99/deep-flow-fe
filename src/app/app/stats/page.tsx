"use client"

import * as React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, AreaChart, Area } from 'recharts'
import { Clock, ListChecks, TrendingUp, Flame, Trophy, Loader2 } from 'lucide-react'
import { StatCard } from '@/components/features/stats/StatCard'
import { CalendarHeatmap } from '@/components/features/stats/CalendarHeatmap'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useDashboard, useWeeklyTrend, useDayOfWeek, useHourly, useCalendar, useLogActivity } from '@/hooks/useStats'

const DAY_LABELS: Record<string, string> = {
  MONDAY: '월', TUESDAY: '화', WEDNESDAY: '수', THURSDAY: '목',
  FRIDAY: '금', SATURDAY: '토', SUNDAY: '일',
}

const DAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

function formatHours(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}m`
}

function formatAvg(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}분`
}

interface ChangeResult {
  type: 'percent' | 'absolute'
  value: number
  direction: 'up' | 'down' | 'same'
}

function calcChange(current: number, previous: number): ChangeResult | null {
  if (previous === 0 && current === 0) return null
  if (previous === 0) return { type: 'absolute', value: current, direction: 'up' }
  const percent = Math.round(((current - previous) / previous) * 100)
  if (percent === 0) return { type: 'percent', value: 0, direction: 'same' }
  return { type: 'percent', value: Math.abs(percent), direction: percent > 0 ? 'up' : 'down' }
}

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px',
}

export default function StatsPage() {
  const now = new Date()
  const [calYear, setCalYear] = React.useState(now.getFullYear())
  const [calMonth, setCalMonth] = React.useState(now.getMonth() + 1)

  const { data: dashboard, isLoading: dashLoading } = useDashboard()
  const { data: weeklyTrend } = useWeeklyTrend()
  const { data: dayOfWeek } = useDayOfWeek()
  const { data: hourly } = useHourly()
  const { data: calendar } = useCalendar(calYear, calMonth)
  const { data: activity } = useLogActivity()

  const sessionChange = dashboard ? calcChange(dashboard.thisWeekSessions, dashboard.lastWeekSessions) : undefined
  const durationChange = dashboard ? calcChange(dashboard.thisWeekDurationSeconds, dashboard.lastWeekDurationSeconds) : undefined


  const weeklyChartData = weeklyTrend?.map(w => ({
    name: w.weekStart.slice(5),
    period: `${w.weekStart.slice(5)} ~ ${w.weekEnd.slice(5)}`,
    시간: Math.round(w.totalDurationSeconds / 3600 * 10) / 10,
    세션: w.totalSessions,
  })) ?? []

  const dayChartData = dayOfWeek
    ?.slice()
    .sort((a, b) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek))
    .map(d => ({
      name: DAY_LABELS[d.dayOfWeek] ?? d.dayOfWeek,
      시간: Math.round(d.totalDurationSeconds / 3600 * 10) / 10,
    })) ?? []

  const hourlyChartData = hourly?.map(h => ({
    name: `${h.hour}시`,
    세션: h.sessionCount,
  })) ?? []

  if (dashLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <h1 className="text-lg font-bold">통계</h1>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard icon={Clock} label="총 집중시간" value={formatHours(dashboard?.totalDurationSeconds ?? 0)} change={durationChange} unit="시간" formatAbsolute={formatHours} />
          <StatCard icon={ListChecks} label="세션 수" value={`${dashboard?.totalSessions ?? 0}회`} change={sessionChange} unit="회" />
          <StatCard icon={TrendingUp} label="평균 세션" value={formatAvg(dashboard?.avgSessionDurationSeconds ?? 0)} />
          <StatCard icon={Flame} label="스트릭" value={`${dashboard?.currentStreak ?? 0}일`} sub={`최장 ${dashboard?.longestStreak ?? 0}일`} />
          <StatCard icon={Trophy} label="칭호" value={`${dashboard?.achievementCount ?? 0}/${dashboard?.totalAchievements ?? 0}`} />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Weekly Trend */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-medium mb-4">주간 추이</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyChartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 11 }} />
                <YAxis className="text-xs" tick={{ fontSize: 11 }} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={tooltipStyle} labelStyle={{ color: 'hsl(var(--foreground))' }} labelFormatter={(_label, payload) => payload?.[0]?.payload?.period ?? _label} />
                <Bar dataKey="시간" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Day of Week */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-medium mb-4">요일별 분포</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dayChartData} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                <XAxis type="number" className="text-xs" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" className="text-xs" tick={{ fontSize: 11 }} width={30} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={tooltipStyle} />
                <Bar dataKey="시간" fill="hsl(142, 71%, 45%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hourly Distribution */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-medium mb-4">시간대별 분포</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={hourlyChartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 10 }} interval={2} />
              <YAxis className="text-xs" tick={{ fontSize: 11 }} />
              <Tooltip cursor={{ fill: 'transparent' }} contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="세션" stroke="hsl(217, 91%, 60%)" fill="hsl(217, 91%, 60%)" fillOpacity={0.15} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Calendar + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Calendar Heatmap */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-medium mb-4">월간 히트맵</h3>
            <CalendarHeatmap
              data={calendar ?? []}
              year={calYear}
              month={calMonth}
              onMonthChange={(y, m) => { setCalYear(y); setCalMonth(m) }}
            />
          </div>

          {/* Activity Summary */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-medium mb-4">기록 활동</h3>
            <div className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">총 로그</span>
                <span className="text-sm font-medium">{activity?.totalLogs ?? 0}개</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">총 이미지</span>
                <span className="text-sm font-medium">{activity?.totalImages ?? 0}장</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">평균 글자 수</span>
                <span className="text-sm font-medium">{activity?.avgContentLength ?? 0}자</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}
