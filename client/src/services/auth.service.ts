/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import api, { extractErrorMessage } from '../lib/axios';
import type { LoginInput, SignupInput, LoginResponse } from '../types/auth.types';
import type { User } from '../types/user.types';

export const authService = {
  login: async (data: LoginInput): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  signup: async (data: SignupInput): Promise<User> => {
    const response = await api.post('/auth/signup', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Logout should always succeed client-side
    }
  },

  getMe: async (): Promise<User> => {
    const response = await api.get('/users/me');
    return response.data;
  },

  refreshToken: async (): Promise<{ access_token: string }> => {
    const response = await api.post('/auth/refresh_token');
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post('/auth/change_password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },

  // ── Resend verification email ───────────────────────────────────────
  resendVerification: async (email: string): Promise<{ message: string }> => {
    const response = await api.post('/auth/resend_verify_link', { email });
    return response.data;
  },

  // ── Request password reset (forgot password) ───────────────────────
  requestPasswordReset: async (email: string): Promise<{ message: string }> => {
    const response = await api.post('/auth/password_reset', { email });
    return response.data;
  },

  // ── Confirm password reset with token ──────────────────────────────
  confirmPasswordReset: async (
    token: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<{ message: string }> => {
    const response = await api.post(`/auth/confirm_password/${token}`, {
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
    return response.data;
  },

  // ── Delete account ─────────────────────────────────────────────────
  deleteAccount: async (): Promise<{ message: string }> => {
    const response = await api.delete('/users/me');
    return response.data;
  },
};
