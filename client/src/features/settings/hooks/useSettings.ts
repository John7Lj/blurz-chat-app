/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../../../store/auth.store';
import { useUIStore } from '../../../store/ui.store';
import { useLogout } from '../../../hooks/useAuth';
import { authService } from '../../../services/auth.service';
import { extractErrorMessage } from '../../../lib/axios';

export function useSettings() {
  const [activeSection, setActiveSection] = useState('appearance');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const user = useAuthStore(s => s.user);
  const storeLogout = useAuthStore(s => s.logout);
  const theme = useUIStore(s => s.theme);
  const toggleTheme = useUIStore(s => s.toggleTheme);
  const setTheme = useUIStore(s => s.setTheme);
  const logout = useLogout();
  const navigate = useNavigate();

  // ── Change Password ─────────────────────────────────────────────
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const setPasswordField = (key: keyof typeof passwordForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setPasswordForm(prev => ({ ...prev, [key]: e.target.value }));

  const changePasswordMutation = useMutation({
    mutationFn: () =>
      authService.changePassword(passwordForm.currentPassword, passwordForm.newPassword),
    onSuccess: () => {
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err));
    },
  });

  const handleChangePassword = () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (passwordForm.newPassword.length > 72) {
      toast.error('New password must be at most 72 characters');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    changePasswordMutation.mutate();
  };

  // ── Delete Account ──────────────────────────────────────────────
  const deleteAccountMutation = useMutation({
    mutationFn: () => authService.deleteAccount(),
    onSuccess: () => {
      toast.success('Account deleted successfully');
      storeLogout();
      navigate('/login');
    },
    onError: () => {
      toast.error('Failed to delete account');
    },
  });

  return {
    activeSection,
    setActiveSection,
    user,
    theme,
    toggleTheme,
    setTheme,
    logout,
    showDeleteConfirm,
    setShowDeleteConfirm,
    deleteAccountMutation,
    passwordForm,
    setPasswordField,
    handleChangePassword,
    isChangingPassword: changePasswordMutation.isPending,
  };
}
