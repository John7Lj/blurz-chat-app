/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useState } from 'react';
import { Link } from 'react-router';
import { AlertCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { authService } from '../services/auth.service';
import { extractErrorMessage } from '../lib/axios';
import { useLogin } from '../hooks/useAuth';
import { PasswordField } from '../features/auth/components/PasswordField';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const loginMutation = useLogin();

  const resendMutation = useMutation({
    mutationFn: (email: string) => authService.resendVerification(email),
    onSuccess: () => toast.success('Verification link sent! Check your inbox.'),
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(form);
  };

  const isValid = form.email.trim() && form.password.length >= 6;
  
  // Extract error info to show resend button if needed
  const errorMessage = loginMutation.error ? extractErrorMessage(loginMutation.error) : null;
  const isUnverified = errorMessage?.toLowerCase().includes('not verified');

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
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
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
            <img src="/blurz-logo.png" alt="Blurz" style={{ width: 40, height: 40, objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
            Login to continue
          </h1>
        </div>

        {/* Server error banner */}
        {errorMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
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
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <span>{errorMessage}</span>
              {isUnverified && (
                <button
                  type="button"
                  onClick={() => resendMutation.mutate(form.email)}
                  disabled={resendMutation.isPending}
                  style={{
                    display: 'block',
                    marginTop: 6,
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: 'var(--color-accent-light)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  {resendMutation.isPending ? 'Sending...' : 'Resend verification email'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              className="input-field"
              value={form.email}
              onChange={set('email')}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          {/* Password */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                Password
              </label>
              <Link to="/forgot-password" style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-accent-light)' }}>
                Forgot password?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <PasswordField
                id="login-password"
                value={form.password}
                onChange={set('password')}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn-primary"
            disabled={!isValid || loginMutation.isPending}
            style={{ marginTop: 6 }}
          >
            {loginMutation.isPending ? 'Logging in…' : 'Login'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <div className="divider" />
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)', flexShrink: 0, userSelect: 'none' }}>or</span>
          <div className="divider" />
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--color-text-secondary)', margin: 0 }}>
          Don't have an account?{' '}
          <Link
            to="/signup"
            style={{ fontWeight: 600, color: 'var(--color-accent-light)' }}
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}