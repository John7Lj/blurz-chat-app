import { useState } from 'react';
import { Link } from 'react-router';
import { Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { useSignup } from '../../hooks/use-auth';

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    username: '',
    email: '',
    phone: '',
    first_name: '',
    last_name: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const signupMutation = useSignup();

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signupMutation.mutate({ ...form, profile_picture: null });
  };

  const isStep1Valid = form.first_name && form.last_name && form.email;
  const isStep2Valid = form.username && form.phone && form.password.length >= 8;

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
                  <input id="signup-first-name" className="input-field" value={form.first_name} onChange={set('first_name')} placeholder="John" autoComplete="given-name" />
                </div>
                <div>
                  <label style={labelStyle}>Last Name</label>
                  <input id="signup-last-name" className="input-field" value={form.last_name} onChange={set('last_name')} placeholder="Doe" autoComplete="family-name" />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Email Address</label>
                <input id="signup-email" type="email" className="input-field" value={form.email} onChange={set('email')} placeholder="john@example.com" autoComplete="email" />
              </div>

              <button
                type="button"
                className="btn-primary"
                onClick={() => setStep(2)}
                disabled={!isStep1Valid}
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
                <input id="signup-username" className="input-field" value={form.username} onChange={set('username')} placeholder="johndoe" maxLength={20} />
              </div>

              <div>
                <label style={labelStyle}>Phone Number</label>
                <input id="signup-phone" type="tel" className="input-field" value={form.phone} onChange={set('phone')} placeholder="+1 234 567 8900" />
              </div>

              <div>
                <label style={labelStyle}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    className="input-field"
                    value={form.password}
                    onChange={set('password')}
                    placeholder="Min 8 characters"
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword((p) => !p)}
                    style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--color-text-muted)', display: 'flex', padding: 4,
                    }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
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
                  disabled={!isStep2Valid || signupMutation.isPending}
                  onClick={handleSubmit}
                  style={{ flex: 1 }}
                >
                  {signupMutation.isPending ? 'Creating…' : 'Create Account'}
                </button>
              </div>
            </div>
          </div>
        </div>

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