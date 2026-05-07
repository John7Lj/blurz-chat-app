import axios from 'axios';
import { API_URL } from './constants';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// ── Request Interceptor: Attach JWT ─────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response Interceptor: Global error handling ─────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // Token expired or invalid — clear and redirect
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_id');
      window.dispatchEvent(new Event('auth-error'));
    }

    return Promise.reject(error);
  },
);

/**
 * Extract a user-friendly error message from an Axios error.
 */
export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (typeof detail === 'object' && detail?.message) return detail.message;
    if (error.response?.data?.message) return error.response.data.message;
    if (error.message) return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

export default api;
