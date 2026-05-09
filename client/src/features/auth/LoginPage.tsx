/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useState } from 'react';
import { Link } from 'react-router';
import { Eye, EyeOff } from 'lucide-react';
import { useLogin } from '../../hooks/use-auth';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLogin();

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(form);
  };

  const isValid = form.email.trim() && form.password.length >= 6;

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
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="input-field"
                value={form.password}
                onChange={set('password')}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((p) => !p)}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  display: 'flex',
                  padding: 4,
                }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
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