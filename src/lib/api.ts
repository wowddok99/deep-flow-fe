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
  imageUrls: string[];
}

export interface CursorResponse<T> {
  content: T[];
  nextCursorId: number | null;
  hasNext: boolean;
}

export const sessionsApi = {
  sessions: {
    start: async (): Promise<FocusSession> => {
      const res = await axiosInstance.post<FocusSession>('/sessions/start');
      return res.data;
    },
    stop: async (id: number): Promise<void> => {
      await axiosInstance.post(`/sessions/${id}/stop`);
    },
    list: async (cursorId?: number, size = 20): Promise<CursorResponse<SessionSummary>> => {
      const res = await axiosInstance.get<CursorResponse<SessionSummary>>('/sessions', {
        params: { cursorId, size }
      });
      return res.data;
    },
    get: async (id: number): Promise<SessionDetail> => {
      const res = await axiosInstance.get<SessionDetail>(`/sessions/${id}`);
      return res.data;
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

// Export as 'api' to maintain backward compatibility with existing imports, 
// ensuring we don't conflict with the 'api' import from axios.
export { sessionsApi as api };
