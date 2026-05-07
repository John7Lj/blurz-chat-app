import { useState } from 'react';
import { Link } from 'react-router';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useLogin } from '../../hooks/use-auth';
import { AuthBrandPanel } from './AuthBrandPanel';

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
      className="min-h-dvh flex"
      style={{ background: 'var(--color-bg-primary)' }}
    >
      {/* Left brand panel */}
      <AuthBrandPanel />

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden px-6 py-12 lg:px-16">
        {/* Mobile aurora — only shows when brand panel is hidden */}
        <div className="aurora-bg lg:hidden" />

        {/* Form card */}
        <div className="w-full max-w-[400px] relative z-10">
          {/* Mobile logo */}
          <div className="flex lg:hidden flex-col items-center mb-6">
            <img
              src="/blurz-logo.png"
              alt="Blurz"
              className="w-12 h-12 mb-3 animate-fade-in"
              style={{ filter: 'drop-shadow(0 4px 12px rgba(109,40,217,0.5))' }}
            />
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1
              className="text-[28px] font-bold tracking-tight mb-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Welcome back
            </h1>
            <p
              className="text-[14px] leading-relaxed"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Sign in to your account to continue
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input
              id="login-email"
              type="email"
              label="Email Address"
              value={form.email}
              onChange={set('email')}
              placeholder="you@example.com"
              icon={<Mail size={15} />}
              autoComplete="email"
              required
            />

            <Input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              label="Password"
              value={form.password}
              onChange={set('password')}
              placeholder="Enter your password"
              icon={<Lock size={15} />}
              rightIcon={
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((p) => !p)}
                  className="p-1 transition-colors"
                  style={{ color: 'var(--color-text-muted)' }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.color =
                      'var(--color-text-primary)')
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.color =
                      'var(--color-text-muted)')
                  }
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
              autoComplete="current-password"
              required
            />

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between -mt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded cursor-pointer"
                  style={{
                    accentColor: 'var(--color-accent)',
                    borderColor: 'var(--color-border)',
                    background: 'var(--color-bg-input)',
                  }}
                />
                <span
                  className="text-[13px] select-none"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Remember me
                </span>
              </label>
              <button
                type="button"
                className="text-[13px] font-medium transition-colors"
                style={{ color: 'var(--color-accent-light)' }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = '#ffffff')
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.color =
                    'var(--color-accent-light)')
                }
              >
                Forgot password?
              </button>
            </div>

            <Button
              id="login-submit"
              type="submit"
              size="lg"
              className="w-full mt-1"
              loading={loginMutation.isPending}
              disabled={!isValid}
            >
              Sign In
            </Button>
          </form>

          {/* Footer */}
          <p
            className="mt-7 text-center text-[13px]"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="font-semibold transition-colors"
              style={{ color: 'var(--color-accent-light)' }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.color = '#ffffff')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.color =
                  'var(--color-accent-light)')
              }
            >
              Create one now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}