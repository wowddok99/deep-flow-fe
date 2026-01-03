import { create } from 'zustand';
import api from '@/lib/axios';
import { persist } from 'zustand/middleware';
import { useTimerStore } from './timer-store';

interface User {
    // Add user fields if we decode the token or fetch user profile
    // specific fields can be added later
    username?: string;
}

interface LoginRequest {
  username: string;
  password: string;
}

interface SignupRequest {
  username: string;
  password: string;
  name: string;
}

interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean;
  user: User | null;
  
  setToken: (token: string) => void;
  login: (credentials: LoginRequest) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

// Initialize axios with store callbacks
import { setupAxios } from '@/lib/axios';

// ... (previous code)

export const useAuthStore = create<AuthState>((set, get) => {
    const store = {
       // ... methods
      accessToken: null,
      isAuthenticated: false,
      user: null,
    
      setToken: (token: string) => {
        set({ accessToken: token, isAuthenticated: true });
      },
    
      login: async (credentials: LoginRequest) => { // Type annotation added
        const response = await api.post('/auth/login', credentials);
        const { accessToken } = response.data;
        set({ accessToken, isAuthenticated: true });
      },
    
      signup: async (data: SignupRequest) => { // Type annotation added
        await api.post('/auth/signup', data);
      },
    
      logout: async () => {
        try {
            await api.post('/auth/logout');
        } catch (e) {
            console.error("Logout failed", e);
        } finally {
            set({ accessToken: null, isAuthenticated: false, user: null });
            useTimerStore.getState().stopTimer(); // Clear persisted timer state
            window.location.href = '/'; 
        }
      },
    
      checkAuth: async () => {
          try {
              const response = await api.post('/auth/reissue');
              const { accessToken } = response.data;
              set({ accessToken, isAuthenticated: true });
          } catch (e) {
              set({ accessToken: null, isAuthenticated: false });
          }
      }
    };
    
    return store;
});

// Set up circular dependency injection
setupAxios(
    () => useAuthStore.getState().accessToken,
    () => useAuthStore.getState().logout(),
    (token) => useAuthStore.getState().setToken(token)
);
