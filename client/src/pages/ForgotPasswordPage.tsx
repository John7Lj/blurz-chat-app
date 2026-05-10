/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useState } from 'react';
import { Link } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { authService } from '../services/auth.service';
import { extractErrorMessage } from '../lib/axios';
import { ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const resetMutation = useMutation({
    mutationFn: (email: string) => authService.requestPasswordReset(email),
    onSuccess: () => {
      setIsSubmitted(true);
      toast.success('Reset link sent if the email exists.');
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    resetMutation.mutate(email);
  };

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
        <Link
          to="/login"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--color-text-muted)',
            fontSize: '14px',
            marginBottom: '24px',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
        >
          <ArrowLeft size={16} />
          Back to Login
        </Link>

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
            <Mail size={28} color="white" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, textAlign: 'center' }}>
            Forgot Password
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', textAlign: 'center', marginTop: 8 }}>
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {isSubmitted ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p style={{ fontSize: 15, color: 'var(--color-text-primary)', marginBottom: 20 }}>
              Check your inbox!
            </p>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 24 }}>
              If an account exists for <strong>{email}</strong>, you will receive an email with instructions on how to reset your password.
            </p>
            <button
              className="btn-primary"
              onClick={() => setIsSubmitted(false)}
            >
              Try another email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                Email Address
              </label>
              <input
                type="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={!email.trim() || resetMutation.isPending}
              style={{ marginTop: 6 }}
            >
              {resetMutation.isPending ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
