/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../store/auth.store';
import { queryClient } from '../lib/queryClient';
import { extractErrorMessage } from '../lib/axios';
import type { LoginInput, SignupInput } from '../types/auth.types';

export function useLogin() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (data: LoginInput) => authService.login(data),
    onSuccess: (res) => {
      setAuth(res.access_token, res.user_id);
      sessionStorage.setItem('access_token', res.access_token);
      sessionStorage.setItem('user_id', res.user_id);
      toast.success('Welcome back!');
      navigate('/chat');
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
}

export function useSignup() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: SignupInput) => authService.signup(data),
    onSuccess: () => {
      toast.success('Account created! Check your email to verify.');
      navigate('/login');
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
}

export function useLogout() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      logout();
      queryClient.clear();
      navigate('/login');
    },
  });
}
