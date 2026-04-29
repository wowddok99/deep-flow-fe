import axiosInstance from '@/lib/axios';

// ============================================================
// Common
// ============================================================

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string };
}

export interface CursorResponse<T> {
  content: T[];
  nextCursorId: number | null;
  hasNext: boolean;
}

// 불투명 토큰 기반 커서 (크루 피드 등 keyset pagination 사용처)
export interface CursorTokenResponse<T> {
  content: T[];
  nextCursor: string | null;
  hasNext: boolean;
}

// 검색 전용 (offset 페이지네이션)
export interface SearchPage<T> {
  items: T[];
  offset: number;
  size: number;
  hasNext: boolean;
}

// ============================================================
// Sessions (기존)
// ============================================================

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
  content: object;
  title: string;
  summary: string;
  tags: string[];
  imageUrls: string[];
}

export interface SessionDetail extends SessionSummary {
  content: object | null;
  aiSummary: string | null;
  imageUrls: string[];
  // 10-2 보강: 공유 상태
  sharedCrewId: number | null;
  sharedAt: string | null;
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

// ============================================================
// Achievements (기존)
// ============================================================

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

// ============================================================
// Stats (기존)
// ============================================================

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

// ============================================================
// Crew (기존)
// ============================================================

export type CrewVisibility = 'PUBLIC' | 'PRIVATE'
export type CrewRole = 'OWNER' | 'MEMBER'
export type InviteTtl = 5 | 30 | 60 | 1440

export interface CrewSummary {
  id: number
  name: string
  description: string | null
  visibility: CrewVisibility
  maxMembers: number | null
  memberCount: number
  activeNowCount: number
  role: CrewRole | null
  createdAt: string
}

export interface CrewMemberInfo {
  userId: number
  name: string
  role: CrewRole
  joinedAt: string
  isActiveNow: boolean
}

export interface CrewDetail {
  id: number
  name: string
  description: string | null
  visibility: CrewVisibility
  maxMembers: number | null
  memberCount: number
  activeNowCount: number
  myRole: CrewRole
  inviteCode: string | null
  inviteCodeExpiresAt: string | null
  createdAt: string
  members: CrewMemberInfo[]
}

export interface InviteCodeIssued {
  code: string
  expiresAt: string
}

export interface CrewActivity {
  activeNowCount: number
  todayParticipantCount: number
  todayTotalDurationSeconds: number
  weeklyTrend: { date: string; totalDurationSeconds: number }[]
  memberRanking: { userId: number; name: string; totalDurationSeconds: number }[]
}

export interface CreateCrewRequest {
  name: string
  description?: string
  visibility: CrewVisibility
  maxMembers?: number | null
}

export interface UpdateCrewRequest {
  name: string
  description: string | null
  visibility: CrewVisibility
  maxMembers: number | null
}

export const crewsApi = {
  create: async (payload: CreateCrewRequest): Promise<CrewSummary> => {
    const res = await axiosInstance.post<ApiResponse<CrewSummary>>('/crews', payload)
    return res.data.data
  },
  listMine: async (): Promise<CrewSummary[]> => {
    const res = await axiosInstance.get<ApiResponse<CrewSummary[]>>('/crews')
    return res.data.data
  },
  detail: async (crewId: number): Promise<CrewDetail> => {
    const res = await axiosInstance.get<ApiResponse<CrewDetail>>(`/crews/${crewId}`)
    return res.data.data
  },
  search: async (q: string, cursorId?: number, size = 20): Promise<CursorResponse<CrewSummary>> => {
    const res = await axiosInstance.get<ApiResponse<CursorResponse<CrewSummary>>>('/crews/search', {
      params: { q, cursorId, size },
    })
    return res.data.data
  },
  update: async (crewId: number, payload: UpdateCrewRequest): Promise<CrewSummary> => {
    const res = await axiosInstance.patch<ApiResponse<CrewSummary>>(`/crews/${crewId}`, payload)
    return res.data.data
  },
  disband: async (crewId: number): Promise<void> => {
    await axiosInstance.delete(`/crews/${crewId}`)
  },
  issueInviteCode: async (crewId: number, ttlMinutes: InviteTtl): Promise<InviteCodeIssued> => {
    const res = await axiosInstance.post<ApiResponse<InviteCodeIssued>>(`/crews/${crewId}/invite`, { ttlMinutes })
    return res.data.data
  },
  joinByCode: async (code: string): Promise<CrewSummary> => {
    const res = await axiosInstance.post<ApiResponse<CrewSummary>>('/crews/join', { code })
    return res.data.data
  },
  joinPublic: async (crewId: number): Promise<CrewSummary> => {
    const res = await axiosInstance.post<ApiResponse<CrewSummary>>(`/crews/${crewId}/join`)
    return res.data.data
  },
  leave: async (crewId: number): Promise<void> => {
    await axiosInstance.delete(`/crews/${crewId}/members/me`)
  },
  kick: async (crewId: number, userId: number): Promise<void> => {
    await axiosInstance.delete(`/crews/${crewId}/members/${userId}`)
  },
  activity: async (crewId: number): Promise<CrewActivity> => {
    const res = await axiosInstance.get<ApiResponse<CrewActivity>>(`/crews/${crewId}/activity`)
    return res.data.data
  },
}

export const crewKeys = {
  all: ['crews'] as const,
  lists: () => [...crewKeys.all, 'list'] as const,
  mine: () => [...crewKeys.lists(), 'mine'] as const,
  detail: (id: number) => [...crewKeys.all, 'detail', id] as const,
  activity: (id: number) => [...crewKeys.all, 'activity', id] as const,
  search: (q: string) => [...crewKeys.all, 'search', q] as const,
}

export const roleLabel = (role: CrewRole | null): string => {
  if (role === 'OWNER') return '리더'
  if (role === 'MEMBER') return '멤버'
  return ''
}

// ============================================================
// 공유 세션 (P1)
// ============================================================

export interface UserBrief { id: number; name: string }

export interface ShareSessionRequest { crewId: number; tags?: string[] }
export interface UpdateShareTagsRequest { tags: string[] }
export interface SharedSessionResponse {
  sessionId: number
  crewId: number
  sharedAt: string
  tags: string[]
}

export interface CrewFeedItem {
  sessionId: number
  user: UserBrief
  title: string | null
  summaryPreview: string | null
  durationSeconds: number
  sharedAt: string
  tags: string[]
  reactionCount: number
  commentCount: number
  edited: boolean   // 10-4 보강
}

export const shareApi = {
  share: async (sessionId: number, payload: ShareSessionRequest): Promise<SharedSessionResponse> => {
    const res = await axiosInstance.post<ApiResponse<SharedSessionResponse>>(`/sessions/${sessionId}/share`, payload)
    return res.data.data
  },
  unshare: async (sessionId: number): Promise<void> => {
    await axiosInstance.delete(`/sessions/${sessionId}/share`)
  },
  updateTags: async (sessionId: number, payload: UpdateShareTagsRequest): Promise<SharedSessionResponse> => {
    const res = await axiosInstance.put<ApiResponse<SharedSessionResponse>>(`/sessions/${sessionId}/share/tags`, payload)
    return res.data.data
  },
}

export const feedApi = {
  list: async (crewId: number, cursor?: string, size = 20, tag?: string): Promise<CursorTokenResponse<CrewFeedItem>> => {
    const res = await axiosInstance.get<ApiResponse<CursorTokenResponse<CrewFeedItem>>>(`/crews/${crewId}/feed`, {
      params: { cursor, size, tag },
    })
    return res.data.data
  },
  detail: async (crewId: number, sessionId: number): Promise<CrewFeedItem> => {
    const res = await axiosInstance.get<ApiResponse<CrewFeedItem>>(`/crews/${crewId}/sessions/${sessionId}`)
    return res.data.data
  },
}

export const feedKeys = {
  all: ['feed'] as const,
  list: (crewId: number, tag?: string) => [...feedKeys.all, 'list', crewId, tag ?? null] as const,
  detail: (crewId: number, sessionId: number) => [...feedKeys.all, 'detail', crewId, sessionId] as const,
}

// ============================================================
// 태그 (P1)
// ============================================================

export interface TagSuggestion { tag: string; count: number }

export const tagApi = {
  popular: async (crewId: number, limit = 10): Promise<TagSuggestion[]> => {
    const res = await axiosInstance.get<ApiResponse<TagSuggestion[]>>(`/crews/${crewId}/tags`, {
      params: { limit },
    })
    return res.data.data
  },
  suggest: async (crewId: number, q: string, limit = 10): Promise<TagSuggestion[]> => {
    const res = await axiosInstance.get<ApiResponse<TagSuggestion[]>>(`/crews/${crewId}/tags/suggest`, {
      params: { q, limit },
    })
    return res.data.data
  },
  myRecent: async (limit = 10): Promise<string[]> => {
    const res = await axiosInstance.get<ApiResponse<string[]>>('/users/me/tags/recent', {
      params: { limit },
    })
    return res.data.data
  },
}

export const tagKeys = {
  popular: (crewId: number) => ['tags', 'popular', crewId] as const,
  recent: ['tags', 'recent'] as const,
  suggest: (crewId: number, q: string) => ['tags', 'suggest', crewId, q] as const,
}

// ============================================================
// 라이브 프레즌스 (P1)
// ============================================================

export interface ActiveMember {
  userId: number
  name: string
  sessionStartedAt: string
}
export interface LivePresence { activeMembers: ActiveMember[] }

export const presenceApi = {
  live: async (crewId: number): Promise<LivePresence> => {
    const res = await axiosInstance.get<ApiResponse<LivePresence>>(`/crews/${crewId}/presence/live`)
    return res.data.data
  },
}

export const presenceKeys = {
  live: (crewId: number) => ['presence', 'live', crewId] as const,
}

// ============================================================
// 리액션 (P2)
// ============================================================

// IDEA 결정 7번 - 고정 5종
export const REACTION_EMOJIS = ['👍', '🔥', '☕', '💡', '🎯'] as const
export type ReactionEmoji = typeof REACTION_EMOJIS[number]

export interface ReactionToggleResponse {
  emoji: string
  added: boolean
  totalCount: number
  userReacted: boolean
}

export interface EmojiCount {
  emoji: string
  count: number
  userReacted: boolean
}

export interface ReactionAggregate { items: EmojiCount[] }

export const reactionApi = {
  toggle: async (sessionId: number, emoji: string): Promise<ReactionToggleResponse> => {
    const res = await axiosInstance.post<ApiResponse<ReactionToggleResponse>>(`/sessions/${sessionId}/reactions`, { emoji })
    return res.data.data
  },
  aggregate: async (sessionId: number): Promise<ReactionAggregate> => {
    const res = await axiosInstance.get<ApiResponse<ReactionAggregate>>(`/sessions/${sessionId}/reactions`)
    return res.data.data
  },
}

export const reactionKeys = {
  aggregate: (sessionId: number) => ['reactions', sessionId] as const,
}

// ============================================================
// 적응형 하이라이트 (P2)
// ============================================================

export type HighlightMode = 'EMPTY' | 'GROWING' | 'MATURE'
export type HighlightItemType = 'HOT' | 'LONG' | 'TAG' | 'RECENT'

export interface HighlightItem {
  type: HighlightItemType
  sessionId?: number
  title?: string
  userName?: string
  score?: number
  durationSeconds?: number
  tag?: string
  count?: number
}

export interface CrewHighlight {
  mode: HighlightMode
  items: HighlightItem[]
  recentSharedCount: number
  threshold: number
}

export const highlightApi = {
  get: async (crewId: number): Promise<CrewHighlight> => {
    const res = await axiosInstance.get<ApiResponse<CrewHighlight>>(`/crews/${crewId}/highlights`)
    return res.data.data
  },
}

export const highlightKeys = {
  byCrew: (crewId: number) => ['highlights', crewId] as const,
}

// ============================================================
// 댓글 (P3)
// ============================================================

export interface Author { id: number; name: string }

// 댓글 본문에서 chip 스타일로 강조할 실제 멘션 사용자.
// content 의 '@username' 패턴 중 mentions 의 username 과 일치하는 것만 강조한다.
export interface CommentMentionUser {
  userId: number
  username: string
  name: string
}

export interface CommentNode {
  id: number
  user: Author
  content: string
  mentions: CommentMentionUser[]
  edited: boolean
  deleted: boolean
  createdAt: string
  replies: CommentNode[]
}

export interface CreateCommentRequest {
  parentId?: number
  content: string
  mentions?: number[]
}

export interface UpdateCommentRequest { content: string }

export const commentApi = {
  list: async (sessionId: number): Promise<CommentNode[]> => {
    const res = await axiosInstance.get<ApiResponse<CommentNode[]>>(`/sessions/${sessionId}/comments`)
    return res.data.data
  },
  create: async (sessionId: number, payload: CreateCommentRequest): Promise<CommentNode> => {
    const res = await axiosInstance.post<ApiResponse<CommentNode>>(`/sessions/${sessionId}/comments`, payload)
    return res.data.data
  },
  update: async (commentId: number, payload: UpdateCommentRequest): Promise<CommentNode> => {
    const res = await axiosInstance.patch<ApiResponse<CommentNode>>(`/comments/${commentId}`, payload)
    return res.data.data
  },
  delete: async (commentId: number): Promise<void> => {
    await axiosInstance.delete(`/comments/${commentId}`)
  },
}

export const commentKeys = {
  list: (sessionId: number) => ['comments', sessionId] as const,
}

// ============================================================
// 알림 (P3, 10-1 보강)
// ============================================================

export interface NotificationItem {
  id: number
  commentId: number
  // 10-1 보강: deep link 4 필드
  sessionId: number | null
  crewId: number | null
  actorName: string | null
  contentPreview: string | null
  createdAt: string
  read: boolean
}

export const notificationApi = {
  unread: async (cursorId?: number, size = 20): Promise<CursorResponse<NotificationItem>> => {
    const res = await axiosInstance.get<ApiResponse<CursorResponse<NotificationItem>>>('/notifications/unread', {
      params: { cursorId, size },
    })
    return res.data.data
  },
  read: async (id: number): Promise<void> => {
    await axiosInstance.patch(`/notifications/${id}/read`)
  },
  readAll: async (): Promise<{ updated: number }> => {
    const res = await axiosInstance.patch<ApiResponse<{ updated: number }>>('/notifications/read-all')
    return res.data.data
  },
}

export const notificationKeys = {
  unread: ['notifications', 'unread'] as const,
}

// ============================================================
// 검색 (P4 — type=session|tag, P5 도 동일 엔드포인트)
// ============================================================

export type SearchType = 'session' | 'tag'

export interface SearchResult {
  sessionId: number
  title: string
  summaryPreview: string
  user: Author
  tags: string[]
  sharedAt: string
  score: number
}

export const searchApi = {
  inCrew: async (crewId: number, q: string, type: SearchType = 'session', offset = 0, size = 20): Promise<SearchPage<SearchResult>> => {
    const res = await axiosInstance.get<ApiResponse<SearchPage<SearchResult>>>(`/crews/${crewId}/search`, {
      params: { q, type, offset, size },
    })
    return res.data.data
  },
}

export const searchKeys = {
  inCrew: (crewId: number, q: string, type: SearchType) => ['search', crewId, type, q] as const,
}

// ============================================================
// 멘션 자동완성 (P6)
// ============================================================

export interface MemberSuggestion {
  userId: number
  name: string
  username: string
}

export const mentionApi = {
  suggest: async (crewId: number, q: string, limit = 10): Promise<MemberSuggestion[]> => {
    const res = await axiosInstance.get<ApiResponse<MemberSuggestion[]>>(`/crews/${crewId}/members/suggest`, {
      params: { q, limit },
    })
    return res.data.data
  },
}

export const mentionKeys = {
  suggest: (crewId: number, q: string) => ['member-suggest', crewId, q] as const,
}

// ============================================================
// Backward compat
// ============================================================

export { sessionsApi as api };
