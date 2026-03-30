// 통계 페이지 mock 데이터

export const mockDashboard = {
  totalSessions: 156,
  totalDurationSeconds: 170280,
  avgSessionDurationSeconds: 1092,
  currentStreak: 12,
  longestStreak: 18,
  achievementCount: 8,
  totalAchievements: 82,
  thisWeekSessions: 24,
  thisWeekDurationSeconds: 43200,
  lastWeekSessions: 18,
  lastWeekDurationSeconds: 32400,
}

export const mockWeeklyTrend = [
  { weekStart: '2026-03-02', weekEnd: '2026-03-08', totalSessions: 18, totalDurationSeconds: 32400 },
  { weekStart: '2026-03-09', weekEnd: '2026-03-15', totalSessions: 22, totalDurationSeconds: 39600 },
  { weekStart: '2026-03-16', weekEnd: '2026-03-22', totalSessions: 20, totalDurationSeconds: 36000 },
  { weekStart: '2026-03-23', weekEnd: '2026-03-29', totalSessions: 24, totalDurationSeconds: 43200 },
]

export const mockDayOfWeek = [
  { dayOfWeek: 'MONDAY', label: '월', totalSessions: 25, totalDurationSeconds: 45000 },
  { dayOfWeek: 'TUESDAY', label: '화', totalSessions: 22, totalDurationSeconds: 39600 },
  { dayOfWeek: 'WEDNESDAY', label: '수', totalSessions: 28, totalDurationSeconds: 50400 },
  { dayOfWeek: 'THURSDAY', label: '목', totalSessions: 20, totalDurationSeconds: 36000 },
  { dayOfWeek: 'FRIDAY', label: '금', totalSessions: 18, totalDurationSeconds: 32400 },
  { dayOfWeek: 'SATURDAY', label: '토', totalSessions: 30, totalDurationSeconds: 54000 },
  { dayOfWeek: 'SUNDAY', label: '일', totalSessions: 13, totalDurationSeconds: 23400 },
]

export const mockHourly = Array.from({ length: 24 }, (_, i) => ({
  hour: i,
  sessionCount: i >= 9 && i <= 22
    ? Math.floor(Math.random() * 20) + 5
    : Math.floor(Math.random() * 3),
}))

export const mockCalendar = (() => {
  const data: { date: string; totalSessions: number; totalDurationSeconds: number }[] = []
  for (let d = 1; d <= 29; d++) {
    if (Math.random() > 0.3) {
      const sessions = Math.floor(Math.random() * 6) + 1
      data.push({
        date: `2026-03-${String(d).padStart(2, '0')}`,
        totalSessions: sessions,
        totalDurationSeconds: sessions * (Math.floor(Math.random() * 1800) + 600),
      })
    }
  }
  return data
})()

export const mockActivity = {
  totalLogs: 89,
  totalImages: 34,
  avgContentLength: 320,
}

// 그룹 페이지 mock 데이터

export const mockGroups = [
  {
    id: 1,
    name: '개발 스터디',
    description: '매일 1시간 이상 집중하는 개발 스터디',
    memberCount: 5,
    todayActive: 3,
    inviteCode: 'ABC123',
  },
  {
    id: 2,
    name: 'CS 면접 준비',
    description: 'CS 기초 지식 정리 및 면접 준비',
    memberCount: 8,
    todayActive: 2,
    inviteCode: 'XYZ789',
  },
]
