import axios, { AxiosError, type AxiosRequestHeaders, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/authStore';
import type { ApiResponse, ApiError } from '@/types/common';
import type { LoginResponseDTO } from '@/types/auth';

const baseURL = import.meta.env.VITE_API_BASE_URL as string;

export const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers = config.headers ?? ({} as AxiosRequestHeaders);
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Let the browser set the multipart boundary itself for FormData bodies.
  if (config.data instanceof FormData && config.headers) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// Endpoints where a 401 means "bad credentials", not "access token expired" — never try
// to refresh for these.
const NO_REFRESH_PATHS = ['/auth/login', '/auth/refresh-token', '/auth/verify-otp', '/auth/verify-registration-otp'];

// One refresh at a time: every request that 401s while a refresh is in flight waits on the
// same promise instead of each rotating the refresh token (the backend treats a second use
// of an already-rotated token as theft and revokes the whole session).
let refreshPromise: Promise<string> | null = null;

export function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    const refreshToken = useAuthStore.getState().refreshToken;
    refreshPromise = (
      refreshToken
        ? // Bare axios, not apiClient, so this call skips both interceptors.
          axios.post<ApiResponse<LoginResponseDTO>>(`${baseURL}/restful/v1/api/auth/refresh-token`, { refreshToken })
        : Promise.reject(new Error('No refresh token'))
    )
      .then((res) => {
        const { accessToken, refreshToken: nextRefreshToken } = res.data.data;
        useAuthStore.getState().setTokens(accessToken, nextRefreshToken);
        return accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function forceLogout() {
  useAuthStore.getState().logout();
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

function toApiError(error: AxiosError<ApiResponse<unknown>>): ApiError {
  const message =
    error.response?.data?.message || error.message || 'Something went wrong. Please try again.';
  return { message, statusCode: error.response?.status };
}

apiClient.interceptors.response.use(
  (response) => {
    // Unwrap the ApiResponse<T> envelope so callers work directly with T.
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return { ...response, data: (response.data as ApiResponse<unknown>).data };
    }
    return response;
  },
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const status = error.response?.status;
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const isAuthPath = NO_REFRESH_PATHS.some((p) => original?.url?.includes(p));

    if (status === 401 && original && !original._retry && !isAuthPath && useAuthStore.getState().refreshToken) {
      original._retry = true;
      try {
        await refreshAccessToken();
        // The request interceptor re-attaches the (now refreshed) token from the store.
        return apiClient(original);
      } catch (refreshError) {
        forceLogout();
        const err = refreshError as AxiosError<ApiResponse<unknown>>;
        return Promise.reject(toApiError(err.response ? err : error));
      }
    }

    if (status === 401 && !isAuthPath) {
      forceLogout();
    }
    return Promise.reject(toApiError(error));
  }
);
