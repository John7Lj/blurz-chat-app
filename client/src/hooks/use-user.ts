import { useQuery, useMutation } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import { userService } from '../services/user.service';
import { useAuthStore } from '../stores/auth.store';
import { queryClient } from '../lib/query-client';
import type { User, UpdateUserInput } from '../schemas/user.schema';

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
