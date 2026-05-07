import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../schemas/user.schema';

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
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_id');
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
        // Also write to localStorage for the Axios interceptor
        if (state?.token) {
          localStorage.setItem('access_token', state.token);
        }
        if (state?.userId) {
          localStorage.setItem('user_id', state.userId);
        }
      },
    },
  ),
);
