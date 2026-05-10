/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Link, useParams } from 'react-router';
import { Lock, AlertCircle } from 'lucide-react';
import { extractErrorMessage } from '../lib/axios';
import { PasswordField } from '../features/auth/components/PasswordField';
import { useResetPasswordForm } from '../features/auth/hooks/useResetPasswordForm';

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const {
    form,
    setFieldValue,
    handleSubmit,
    resetMutation,
    isValid,
    isMatch
  } = useResetPasswordForm(token);

  return (
    <div
      className="animate-fade-in"
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg-primary)',
        padding: '16px',
      }}
    >
      <div className="auth-card">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
              background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
              boxShadow: '0 4px 20px rgba(109,40,217,0.4)',
              overflow: 'hidden',
            }}
          >
            <Lock size={28} color="white" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, textAlign: 'center' }}>
            Reset Password
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', textAlign: 'center', marginTop: 8 }}>
            Enter your new password below.
          </p>
        </div>

        {resetMutation.isError && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              marginBottom: 16,
              borderRadius: 10,
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
              fontSize: 13,
              color: '#f87171',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{extractErrorMessage(resetMutation.error)}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
              New Password
            </label>
            <PasswordField
              value={form.newPassword}
              onChange={setFieldValue('newPassword')}
              placeholder="Min 8 characters"
              required
              maxLength={72}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
              Confirm Password
            </label>
            <PasswordField
              value={form.confirmPassword}
              onChange={setFieldValue('confirmPassword')}
              placeholder="Confirm new password"
              required
              maxLength={72}
            />
            {form.confirmPassword.length > 0 && !isMatch && (
              <p style={{ fontSize: 11, color: '#f87171', marginTop: 4 }}>Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={!isValid || resetMutation.isPending}
            style={{ marginTop: 6 }}
          >
            {resetMutation.isPending ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--color-text-secondary)', margin: '24px 0 0 0' }}>
          Remembered your password?{' '}
          <Link
            to="/login"
            style={{ fontWeight: 600, color: 'var(--color-accent-light)' }}
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
