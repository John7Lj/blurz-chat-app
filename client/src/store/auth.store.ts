/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/user.types';

interface AuthState {
  token: string | null;
  userId: string | null;
  user: User | null;
  isAuthenticated: boolean;

  setAuth: (token: string, userId: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      userId: null,
      user: null,
      isAuthenticated: false,

      setAuth: (token, userId) =>
        set({ token, userId, isAuthenticated: true }),

      setUser: (user) => set({ user }),

      logout: () => {
        set({ token: null, userId: null, user: null, isAuthenticated: false });
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('user_id');
      },
    }),
    {
      name: 'blurz-auth',
      partialize: (state) => ({
        token: state.token,
        userId: state.userId,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Also write to sessionStorage for the Axios interceptor
        if (state?.token) {
          sessionStorage.setItem('access_token', state.token);
        }
        if (state?.userId) {
          sessionStorage.setItem('user_id', state.userId);
        }
      },
    },
  ),
);
