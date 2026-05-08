import { useState } from 'react';
import { Link } from 'react-router';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
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
      className="min-h-dvh flex items-center justify-center relative overflow-hidden px-4"
      style={{ background: 'var(--color-bg-primary)' }}
    >
      {/* Background glow */}
      <div className="aurora-bg" />

      {/* Auth card — vuetify-chat centered card style */}
      <div
        className="w-full max-w-[420px] relative z-10 rounded-2xl p-8 sm:p-10 animate-slide-up"
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Logo + App name */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
              boxShadow: '0 4px 24px rgba(109,40,217,0.4)',
            }}
          >
            <img
              src="/blurz-logo.png"
              alt="Blurz"
              className="w-10 h-10 object-contain"
            />
          </div>
          <h1
            className="text-[24px] font-bold tracking-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Login to continue
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="login-email"
            type="email"
            label="Email Address"
            value={form.email}
            onChange={set('email')}
            placeholder="you@example.com"
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

          <Button
            id="login-submit"
            type="submit"
            size="lg"
            className="w-full mt-2"
            loading={loginMutation.isPending}
            disabled={!isValid}
          >
            Login
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
          <span className="text-[12px]" style={{ color: 'var(--color-text-muted)', userSelect: 'none' }}>or</span>
          <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
        </div>

        {/* Footer */}
        <p
          className="text-center text-[14px]"
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
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}