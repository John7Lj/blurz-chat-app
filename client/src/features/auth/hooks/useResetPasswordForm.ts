/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { authService } from '../../../services/auth.service';
import { extractErrorMessage } from '../../../lib/axios';

export function useResetPasswordForm(token?: string) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });

  const resetMutation = useMutation({
    mutationFn: () => {
      if (!token) throw new Error('Invalid or missing reset token');
      return authService.confirmPasswordReset(token, form.newPassword, form.confirmPassword);
    },
    onSuccess: () => {
      toast.success('Password updated successfully! You can now log in.');
      navigate('/login');
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });

  const setFieldValue = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    resetMutation.mutate();
  };

  const isLengthValid = form.newPassword.length >= 8;
  const isMatch = form.newPassword === form.confirmPassword && form.newPassword !== '';
  const isValid = isLengthValid && isMatch;

  return {
    form,
    setFieldValue,
    handleSubmit,
    resetMutation,
    isValid,
    isMatch
  };
}
