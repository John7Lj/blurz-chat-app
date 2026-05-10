/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

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
    const token = sessionStorage.getItem('access_token');
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
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('user_id');
      window.dispatchEvent(new Event('auth-error'));
    }

    return Promise.reject(error);
  },
);

/**
 * Extract a user-friendly error message from an Axios error.
 * Handles our custom 422 format, standard FastAPI errors, and generic errors.
 */
export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    const detail = data?.detail;

    // Our custom 422 format: { detail: { message: "...", errors: [...] } }
    if (typeof detail === 'object' && detail?.message) return detail.message;

    // Standard FastAPI string detail
    if (typeof detail === 'string') return detail;

    // Pydantic default 422 format (array of errors) — before our custom handler
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0];
      const field = first?.loc?.slice(-1)?.[0] || 'field';
      return `${field}: ${first?.msg || 'Invalid value'}`;
    }

    // Fallback to top-level message
    if (data?.message) return data.message;
    if (error.message) return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

/**
 * Extract all field-specific validation errors from an Axios error.
 * Returns a map of field name → error message for form display.
 */
export function extractFieldErrors(error: unknown): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    // Our custom 422 format with errors array
    if (typeof detail === 'object' && Array.isArray(detail?.errors)) {
      for (const err of detail.errors) {
        if (err.field && err.message) {
          fieldErrors[err.field] = err.message;
        }
      }
    }
  }
  return fieldErrors;
}

export default api;
