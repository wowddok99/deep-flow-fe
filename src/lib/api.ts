import axiosInstance from '@/lib/axios';

export interface FocusSession {
  id: number;
  startTime: string;
  endTime: string | null;
  status: 'IN_PROGRESS' | 'COMPLETED';
}

export interface SessionSummary {
  id: number;
  startTime: string;
  endTime: string | null;
  durationSeconds: number;
  title: string | null;
  summary: string | null;
  tags: string[];
  status: 'ONGOING' | 'COMPLETED';
}

export interface LogUpdateRequest {
  content: object; // Tiptap JSON
  title: string;
  summary: string;
  tags: string[];
  imageUrls: string[];
}

export interface SessionDetail extends SessionSummary {
  content: object | null;
  aiSummary: string | null;
  imageUrls: string[];
}

export interface CursorResponse<T> {
  content: T[];
  nextCursorId: number | null;
  hasNext: boolean;
}

// ApiResponse wrapper from backend
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
}

export const sessionsApi = {
  sessions: {
    start: async (): Promise<FocusSession> => {
      const res = await axiosInstance.post<ApiResponse<FocusSession>>('/sessions/start');
      return res.data.data;
    },
    stop: async (id: number): Promise<void> => {
      await axiosInstance.post(`/sessions/${id}/stop`);
    },
    list: async (cursorId?: number, size = 20): Promise<CursorResponse<SessionSummary>> => {
      const res = await axiosInstance.get<ApiResponse<CursorResponse<SessionSummary>>>('/sessions', {
        params: { cursorId, size }
      });
      return res.data.data;
    },
    get: async (id: number): Promise<SessionDetail> => {
      const res = await axiosInstance.get<ApiResponse<SessionDetail>>(`/sessions/${id}`);
      return res.data.data;
    },
    delete: async (id: number): Promise<void> => {
      await axiosInstance.delete(`/sessions/${id}`);
    },
  },
  logs: {
    update: async (sessionId: number, data: LogUpdateRequest): Promise<void> => {
      await axiosInstance.put(`/sessions/${sessionId}/log`, data);
    }
  }
};

export const imagesApi = {
  upload: async (files: File[], getToken: () => string | null): Promise<string[]> => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    const token = getToken();
    const res = await fetch('/api/v1/images', {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) throw new Error(`이미지 업로드 실패: ${res.status}`);
    const json: ApiResponse<string[]> = await res.json();
    return json.data;
  }
};

// Achievement types
export type AchievementCategory =
  | 'FIRST_STEP' | 'DEEP_DIVE' | 'GROWTH_RING' | 'SESSION_COUNT'
  | 'STREAK' | 'DAILY_INTENSITY' | 'WRITER' | 'VISUAL'
  | 'TIME_ZONE' | 'PATTERN' | 'VETERAN' | 'HIDDEN'

export interface AchievementResponse {
  code: string
  name: string
  description: string
  category: AchievementCategory
  grade: number
  hidden: boolean
  achieved: boolean
}

export interface UserAchievementResponse {
  code: string
  name: string
  description: string
  category: AchievementCategory
  grade: number
  achievedAt: string
}

export const achievementsApi = {
  getAll: async (): Promise<AchievementResponse[]> => {
    const res = await axiosInstance.get<ApiResponse<AchievementResponse[]>>('/achievements')
    return res.data.data
  },
  getMine: async (): Promise<UserAchievementResponse[]> => {
    const res = await axiosInstance.get<ApiResponse<UserAchievementResponse[]>>('/achievements/me')
    return res.data.data
  },
  updateDisplay: async (achievementCode: string): Promise<void> => {
    await axiosInstance.put('/achievements/display', { achievementCode })
  },
}

// Stats types
export interface DashboardOverview {
  totalSessions: number
  totalDurationSeconds: number
  avgSessionDurationSeconds: number
  currentStreak: number
  longestStreak: number
  achievementCount: number
  totalAchievements: number
  thisWeekSessions: number
  thisWeekDurationSeconds: number
  lastWeekSessions: number
  lastWeekDurationSeconds: number
}

export interface WeeklyTrend {
  weekStart: string
  weekEnd: string
  totalSessions: number
  totalDurationSeconds: number
}

export interface DayOfWeekStats {
  dayOfWeek: string
  totalSessions: number
  totalDurationSeconds: number
}

export interface HourlyDistribution {
  hour: number
  sessionCount: number
}

export interface DailyStats {
  date: string
  totalSessions: number
  totalDurationSeconds: number
}

export interface LogActivity {
  totalLogs: number
  totalImages: number
  avgContentLength: number
}

export const statsApi = {
  dashboard: async (): Promise<DashboardOverview> => {
    const res = await axiosInstance.get<ApiResponse<DashboardOverview>>('/stats/dashboard')
    return res.data.data
  },
  weeklyTrend: async (weeks = 4): Promise<WeeklyTrend[]> => {
    const res = await axiosInstance.get<ApiResponse<WeeklyTrend[]>>('/stats/weekly-trend', {
      params: { weeks }
    })
    return res.data.data
  },
  dayOfWeek: async (): Promise<DayOfWeekStats[]> => {
    const res = await axiosInstance.get<ApiResponse<DayOfWeekStats[]>>('/stats/day-of-week')
    return res.data.data
  },
  hourly: async (): Promise<HourlyDistribution[]> => {
    const res = await axiosInstance.get<ApiResponse<HourlyDistribution[]>>('/stats/hourly')
    return res.data.data
  },
  calendar: async (year: number, month: number): Promise<DailyStats[]> => {
    const res = await axiosInstance.get<ApiResponse<DailyStats[]>>('/stats/calendar', {
      params: { year, month }
    })
    return res.data.data
  },
  activity: async (): Promise<LogActivity> => {
    const res = await axiosInstance.get<ApiResponse<LogActivity>>('/stats/activity')
    return res.data.data
  },
}

// Export as 'api' to maintain backward compatibility with existing imports,
// ensuring we don't conflict with the 'api' import from axios.
export { sessionsApi as api };
