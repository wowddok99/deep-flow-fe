import type { AchievementCategory } from '@/lib/api'

export const GRADE_COLORS: Record<number, string> = {
  1: 'text-zinc-400',
  2: 'text-green-400',
  3: 'text-blue-400',
  4: 'text-purple-400',
  5: 'text-amber-400',
}

export const GRADE_BG: Record<number, string> = {
  1: 'bg-zinc-400/5 dark:bg-zinc-400/10 border-zinc-400/10 dark:border-zinc-400/20',
  2: 'bg-green-400/5 dark:bg-green-400/10 border-green-400/10 dark:border-green-400/20',
  3: 'bg-blue-400/5 dark:bg-blue-400/10 border-blue-400/10 dark:border-blue-400/20',
  4: 'bg-purple-400/5 dark:bg-purple-400/10 border-purple-400/10 dark:border-purple-400/20',
  5: 'bg-amber-400/5 dark:bg-amber-400/10 border-amber-400/10 dark:border-amber-400/20',
}

export const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  FIRST_STEP: '첫걸음',
  DEEP_DIVE: '깊은몰입',
  GROWTH_RING: '성장',
  SESSION_COUNT: '세션',
  STREAK: '연속',
  DAILY_INTENSITY: '집중',
  WRITER: '글쓰기',
  VISUAL: '시각',
  TIME_ZONE: '시간대',
  PATTERN: '패턴',
  VETERAN: '베테랑',
  HIDDEN: '히든',
}

export const DEEP_DIVE_THRESHOLDS: Record<string, number> = {
  'D-01': 300,
  'D-02': 900,
  'D-03': 1800,
  'D-04': 3600,
  'D-05': 7200,
  'D-06': 10800,
  'D-07': 14400,
  'D-08': 18000,
}

export function gradeStars(grade: number): string {
  return '★'.repeat(grade)
}
