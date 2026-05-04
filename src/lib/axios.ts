import axios from 'axios';
import { toast } from 'sonner';

// Callbacks to access store without importing it (circular dependency)
let getAccessTokenFn: () => string | null = () => null;
let logoutFn: () => void = () => { };
let setTokenFn: (token: string) => void = () => { };

// 추방 / 탈퇴 후 stale 한 크루 화면에서 발생하는 NOT_CREW_MEMBER 응답을
// 한 번만 처리하도록 가드 (1.5초 redirect 대기 동안 동시 호출 누적 방지).
let kickedRedirectInProgress = false;

export const setupAxios = (
  getToken: () => string | null,
  logout: () => void,
  setToken: (token: string) => void
) => {
  getAccessTokenFn = getToken;
  logoutFn = logout;
  setTokenFn = setToken;
}

// Create a custom Axios instance
const api = axios.create({
  baseURL: '/api/v1', // Proxy via Next.js or direct if configured
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies (RefreshToken)
});

// Request Interceptor: Attach Access Token
api.interceptors.request.use(
  (config) => {
    const token = getAccessTokenFn();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 & Refresh Token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Auth 엔드포인트는 401 처리에서 제외 (로그인 실패 등)
    const isAuthEndpoint = originalRequest.url?.includes('/auth/');

    // Prevent infinite loops & skip auth endpoints
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        // Attempt to reissue token
        // Use raw axios to avoid interceptor checks on this specific request if needed, 
        // but 'api' is fine as long as we don't depend on the old token.
        // We use full URL or relative to baseURL? api instance has baseURL.
        // Safest is to use the same 'api' instance but with a flag? 
        // Or just raw axios with correct baseURL.
        const response = await axios.post('/api/v1/auth/reissue', {}, {
          withCredentials: true
        });

        const newAccessToken = response.data.data.accessToken;

        // Update Store via callback
        setTokenFn(newAccessToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        // Refresh failed (Session expired or invalid)
        logoutFn();
        return Promise.reject(refreshError);
      }
    }

    // 크루에서 추방됐거나 탈퇴 후에도 detail 페이지에 머물러 있을 때 발생하는
    // 403 NOT_CREW_MEMBER 를 잡아 사용자를 크루 목록으로 이동시킨다.
    // FE only 처리 — SSE 가 강퇴 이벤트를 push 하지 않는 현재 구조에선 다음 호출
    // 시점에야 알 수 있다는 한계가 있지만, 가장 단순하고 안전한 경로.
    if (
      error.response?.status === 403 &&
      error.response?.data?.error?.code === 'NOT_CREW_MEMBER' &&
      !kickedRedirectInProgress &&
      typeof window !== 'undefined' &&
      /^\/app\/crews\/\d+/.test(window.location.pathname)
    ) {
      kickedRedirectInProgress = true;
      toast.error('이 크루의 멤버가 아니에요. 크루 목록으로 이동할게요.');
      setTimeout(() => {
        window.location.href = '/app/crews';
      }, 1500);
    }

    return Promise.reject(error);
  }
);

/** Extract error message from ApiResponse error or fallback to generic message */
export function getApiErrorMessage(error: unknown, fallback = '오류가 발생했습니다.'): string {
  if (axios.isAxiosError(error) && error.response?.data) {
    const body = error.response.data;
    if (body.error?.message) {
      return body.error.message;
    }
  }
  return fallback;
}

/** Extract error code from ApiResponse error */
export function getApiErrorCode(error: unknown): string | null {
  if (axios.isAxiosError(error) && error.response?.data) {
    const body = error.response.data;
    if (body.error?.code) {
      return body.error.code;
    }
  }
  return null;
}

export default api;
