import axios, { AxiosError, type AxiosRequestHeaders } from 'axios';
import { useAuthStore } from '@/store/authStore';
import type { ApiResponse, ApiError } from '@/types/common';

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

apiClient.interceptors.response.use(
  (response) => {
    // Unwrap the ApiResponse<T> envelope so callers work directly with T.
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return { ...response, data: (response.data as ApiResponse<unknown>).data };
    }
    return response;
  },
  (error: AxiosError<ApiResponse<unknown>>) => {
    const status = error.response?.status;
    if (status === 401) {
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    const message =
      error.response?.data?.message || error.message || 'Something went wrong. Please try again.';
    const apiError: ApiError = { message, statusCode: status };
    return Promise.reject(apiError);
  }
);
