/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { userService } from '../services/user.service';
import { useAuthStore } from '../store/auth.store';
import { queryClient } from '../lib/queryClient';
import type { User, UpdateUserInput } from '../types/user.types';

export const ME_KEY = ['me'] as const;

export function useCurrentUser() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setUser = useAuthStore((s) => s.setUser);

  return useQuery<User>({
    queryKey: ME_KEY,
    queryFn: async () => {
      const user = await authService.getMe();
      setUser(user);
      return user;
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useUpdateProfile() {
  return useMutation({
    mutationFn: (data: UpdateUserInput) => userService.updateUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ME_KEY });
    },
  });
}
