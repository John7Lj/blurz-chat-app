/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Link } from 'react-router';
import { ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { useSignup } from '../hooks/useAuth';
import { extractErrorMessage } from '../lib/axios';
import { FieldError } from '../features/auth/components/FieldError';
import { PasswordStrength } from '../features/auth/components/PasswordStrength';
import { PasswordField } from '../features/auth/components/PasswordField';
import { useSignupForm } from '../features/auth/hooks/useSignupForm';

export default function SignupPage() {
  const {
    step,
    setStep,
    form,
    setFieldValue,
    handleBlur,
    validateStep1,
    validateStep2,
    showError,
    inputErrorStyle,
    isStep1Filled,
    isStep2Filled
  } = useSignupForm();

  const signupMutation = useSignup();

  const handleContinue = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;
    signupMutation.mutate({ ...form, profile_picture: null });
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    marginBottom: 6,
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
        {/* Logo + Title */}
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
            <img src="/blurz-logo.png" alt="Blurz" style={{ width: 40, height: 40, objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 10px 0' }}>
            Create account
          </h1>

          {/* Step indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {[1, 2].map((s) => (
              <div
                key={s}
                style={{
                  height: 4,
                  width: step === s ? 28 : 12,
                  borderRadius: 9999,
                  background: step === s ? 'var(--color-accent)' : s < step ? 'var(--color-accent-light)' : 'rgba(139,92,246,0.3)',
                  opacity: s < step ? 0.6 : 1,
                  transition: 'width 0.3s, background 0.3s',
                }}
              />
            ))}
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)', marginLeft: 4 }}>
              Step {step} of 2
            </span>
          </div>
        </div>

        {/* Server-side error banner */}
        {signupMutation.isError && (
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
            <span>{signupMutation.error
              ? extractErrorMessage(signupMutation.error)
              : 'Something went wrong'}</span>
          </div>
        )}

        {/* Steps */}
        <div style={{ position: 'relative', minHeight: 280 }}>
          {/* Step 1 */}
          <div
            style={{
              opacity: step === 1 ? 1 : 0,
              transform: step === 1 ? 'translateX(0)' : 'translateX(-20px)',
              position: step === 1 ? 'relative' : 'absolute',
              inset: step === 1 ? 'auto' : 0,
              pointerEvents: step === 1 ? 'auto' : 'none',
              transition: 'opacity 0.25s, transform 0.25s',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>First Name</label>
                  <input
                    id="signup-first-name"
                    className="input-field"
                    value={form.first_name}
                    onChange={setFieldValue('first_name')}
                    onBlur={handleBlur('first_name')}
                    placeholder="John"
                    autoComplete="given-name"
                    maxLength={50}
                    style={inputErrorStyle('first_name')}
                  />
                  <FieldError message={showError('first_name')} />
                </div>
                <div>
                  <label style={labelStyle}>Last Name</label>
                  <input
                    id="signup-last-name"
                    className="input-field"
                    value={form.last_name}
                    onChange={setFieldValue('last_name')}
                    onBlur={handleBlur('last_name')}
                    placeholder="Doe"
                    autoComplete="family-name"
                    maxLength={50}
                    style={inputErrorStyle('last_name')}
                  />
                  <FieldError message={showError('last_name')} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Email Address</label>
                <input
                  id="signup-email"
                  type="email"
                  className="input-field"
                  value={form.email}
                  onChange={setFieldValue('email')}
                  onBlur={handleBlur('email')}
                  placeholder="john@example.com"
                  autoComplete="email"
                  style={inputErrorStyle('email')}
                />
                <FieldError message={showError('email')} />
              </div>

              <button
                type="button"
                className="btn-primary"
                onClick={handleContinue}
                disabled={!isStep1Filled}
                style={{ marginTop: 4 }}
              >
                Continue <ArrowRight size={15} style={{ marginLeft: 6 }} />
              </button>
            </div>
          </div>

          {/* Step 2 */}
          <div
            style={{
              opacity: step === 2 ? 1 : 0,
              transform: step === 2 ? 'translateX(0)' : 'translateX(20px)',
              position: step === 2 ? 'relative' : 'absolute',
              inset: step === 2 ? 'auto' : 0,
              pointerEvents: step === 2 ? 'auto' : 'none',
              transition: 'opacity 0.25s, transform 0.25s',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Username</label>
                <input
                  id="signup-username"
                  className="input-field"
                  value={form.username}
                  onChange={setFieldValue('username')}
                  onBlur={handleBlur('username')}
                  placeholder="johndoe"
                  maxLength={20}
                  style={inputErrorStyle('username')}
                />
                <FieldError message={showError('username')} />
                {!showError('username') && form.username && (
                  <div style={{ marginTop: 4, fontSize: 11, color: 'var(--color-text-muted)' }}>
                    Only letters, numbers, and underscores
                  </div>
                )}
              </div>

              <div>
                <label style={labelStyle}>Phone Number</label>
                <input
                  id="signup-phone"
                  type="tel"
                  className="input-field"
                  value={form.phone}
                  onChange={setFieldValue('phone')}
                  onBlur={handleBlur('phone')}
                  placeholder="+1234567890"
                  style={inputErrorStyle('phone')}
                />
                <FieldError message={showError('phone')} />
                {!showError('phone') && !form.phone && (
                  <div style={{ marginTop: 4, fontSize: 11, color: 'var(--color-text-muted)' }}>
                    International format with country code (e.g., +1234567890)
                  </div>
                )}
              </div>

              <div>
                <label style={labelStyle}>Password</label>
                <PasswordField
                  id="signup-password"
                  value={form.password}
                  onChange={setFieldValue('password')}
                  onBlur={handleBlur('password')}
                  placeholder="Min 8 characters"
                  maxLength={72}
                  errorStyle={inputErrorStyle('password')}
                />
                <FieldError message={showError('password')} />
                <PasswordStrength password={form.password} />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-primary"
                  style={{ width: 44, flexShrink: 0, padding: 0, background: 'var(--color-bg-input)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                  aria-label="Go back"
                >
                  <ArrowLeft size={16} />
                </button>
                <button
                  id="signup-submit"
                  type="button"
                  className="btn-primary"
                  disabled={!isStep2Filled || signupMutation.isPending}
                  onClick={handleSubmit}
                  style={{ flex: 1 }}
                >
                  {signupMutation.isPending ? 'Creating…' : 'Create Account'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Legal */}
        <p style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: 'var(--color-text-muted)' }}>
          By signing up, you agree to our <Link to="/terms" style={{ color: 'var(--color-accent-light)', textDecoration: 'underline' }}>Terms of Service</Link>, <Link to="/privacy" style={{ color: 'var(--color-accent-light)', textDecoration: 'underline' }}>Privacy Policy</Link>, and <Link to="/license" style={{ color: 'var(--color-accent-light)', textDecoration: 'underline' }}>License</Link>.
        </p>

        {/* Footer */}
        <p style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: 'var(--color-text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: 600, color: 'var(--color-accent-light)' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}