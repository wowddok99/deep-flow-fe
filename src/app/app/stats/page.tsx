"use client"

import * as React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, AreaChart, Area } from 'recharts'
import { Clock, ListChecks, TrendingUp, Flame, Trophy } from 'lucide-react'
import { StatCard } from '@/components/features/stats/StatCard'
import { CalendarHeatmap } from '@/components/features/stats/CalendarHeatmap'
import { ScrollArea } from '@/components/ui/scroll-area'
import { mockDashboard, mockWeeklyTrend, mockDayOfWeek, mockHourly, mockCalendar, mockActivity } from '@/lib/mock-data'

function formatHours(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}m`
}

function formatAvg(seconds: number): string {
  const m = Math.floor(seconds / 60)
  return `${m}분`
}

function calcChange(current: number, previous: number): number {
  if (previous === 0) return 0
  return Math.round(((current - previous) / previous) * 100)
}

export default function StatsPage() {
  const [calYear, setCalYear] = React.useState(2026)
  const [calMonth, setCalMonth] = React.useState(3)

  const d = mockDashboard
  const sessionChange = calcChange(d.thisWeekSessions, d.lastWeekSessions)
  const durationChange = calcChange(d.thisWeekDurationSeconds, d.lastWeekDurationSeconds)

  const weeklyChartData = mockWeeklyTrend.map(w => ({
    name: `${w.weekStart.slice(5)}`,
    시간: Math.round(w.totalDurationSeconds / 3600 * 10) / 10,
    세션: w.totalSessions,
  }))

  const dayChartData = mockDayOfWeek.map(d => ({
    name: d.label,
    시간: Math.round(d.totalDurationSeconds / 3600 * 10) / 10,
  }))

  const hourlyChartData = mockHourly.map(h => ({
    name: `${h.hour}시`,
    세션: h.sessionCount,
  }))

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <h1 className="text-lg font-bold">통계</h1>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard icon={Clock} label="총 집중시간" value={formatHours(d.totalDurationSeconds)} change={durationChange} />
          <StatCard icon={ListChecks} label="세션 수" value={`${d.totalSessions}회`} change={sessionChange} />
          <StatCard icon={TrendingUp} label="평균 세션" value={formatAvg(d.avgSessionDurationSeconds)} />
          <StatCard icon={Flame} label="스트릭" value={`${d.currentStreak}일`} sub={`최장 ${d.longestStreak}일`} />
          <StatCard icon={Trophy} label="칭호" value={`${d.achievementCount}/${d.totalAchievements}`} />
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
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
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
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                />
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
              <Tooltip
                cursor={{ fill: 'transparent' }}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
              />
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
              data={mockCalendar}
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
                <span className="text-sm font-medium">{mockActivity.totalLogs}개</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">총 이미지</span>
                <span className="text-sm font-medium">{mockActivity.totalImages}장</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">평균 글자 수</span>
                <span className="text-sm font-medium">{mockActivity.avgContentLength}자</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}
