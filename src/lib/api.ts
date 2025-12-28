const API_BASE_URL = 'http://localhost:8080/api/v1';

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
  summary: string | null;
  tags: string[];
  status: 'ONGOING' | 'COMPLETED';
}

export interface LogUpdateRequest {
  content: object; // Tiptap JSON
  summary: string;
  tags: string[];
}

export interface SessionDetail extends SessionSummary {
  content: string | null;
  imageUrls: string[];
}

export const api = {
  sessions: {
    start: async (): Promise<FocusSession> => {
      const res = await fetch(`${API_BASE_URL}/sessions/start`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to start session');
      return res.json();
    },
    stop: async (id: number): Promise<void> => {
      const res = await fetch(`${API_BASE_URL}/sessions/${id}/stop`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to stop session');
    },
    list: async (): Promise<SessionSummary[]> => {
      const res = await fetch(`${API_BASE_URL}/sessions`);
      if (!res.ok) throw new Error('Failed to fetch sessions');
      return res.json();
    },
    get: async (id: number): Promise<SessionDetail> => {
      const res = await fetch(`${API_BASE_URL}/sessions/${id}`);
      if (!res.ok) throw new Error('Failed to fetch session detail');
      return res.json();
    },
    delete: async (id: number): Promise<void> => {
        const res = await fetch(`${API_BASE_URL}/sessions/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete session');
    }
  },
  logs: {
    update: async (sessionId: number, data: LogUpdateRequest): Promise<void> => {
      const res = await fetch(`${API_BASE_URL}/sessions/${sessionId}/log`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update log');
    }
  }
};
