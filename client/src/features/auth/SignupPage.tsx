import { useState } from 'react';
import { Link } from 'react-router';
import { Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
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
        {/* Logo + Title */}
        <div className="flex flex-col items-center mb-6">
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
            className="text-[24px] font-bold tracking-tight mb-1"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Create account
          </h1>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-2">
            {[1, 2].map((s) => (
              <div
                key={s}
                className="transition-all duration-300 rounded-full"
                style={{
                  height: '4px',
                  width: step === s ? '28px' : '12px',
                  background:
                    step === s
                      ? 'var(--color-accent)'
                      : s < step
                      ? 'var(--color-accent-light)'
                      : 'var(--color-border-strong)',
                  opacity: s < step ? 0.6 : 1,
                }}
              />
            ))}
            <span
              className="text-[12px] ml-1"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Step {step} of 2
            </span>
          </div>
        </div>

        {/* Steps container */}
        <div className="relative" style={{ minHeight: '280px' }}>
          {/* Step 1 */}
          <div
            className="transition-all duration-300"
            style={{
              opacity: step === 1 ? 1 : 0,
              transform: step === 1 ? 'translateX(0)' : 'translateX(-24px)',
              position: step === 1 ? 'relative' : 'absolute',
              inset: step === 1 ? 'auto' : 0,
              pointerEvents: step === 1 ? 'auto' : 'none',
            }}
          >
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  id="signup-first-name"
                  label="First Name"
                  value={form.first_name}
                  onChange={set('first_name')}
                  placeholder="John"
                  autoComplete="given-name"
                />
                <Input
                  id="signup-last-name"
                  label="Last Name"
                  value={form.last_name}
                  onChange={set('last_name')}
                  placeholder="Doe"
                  autoComplete="family-name"
                />
              </div>

              <Input
                id="signup-email"
                type="email"
                label="Email Address"
                value={form.email}
                onChange={set('email')}
                placeholder="john@example.com"
                autoComplete="email"
              />

              <Button
                type="button"
                size="lg"
                className="w-full mt-1"
                onClick={() => setStep(2)}
                disabled={!isStep1Valid}
              >
                Continue <ArrowRight size={15} className="ml-1.5" />
              </Button>
            </div>
          </div>

          {/* Step 2 */}
          <div
            className="transition-all duration-300"
            style={{
              opacity: step === 2 ? 1 : 0,
              transform: step === 2 ? 'translateX(0)' : 'translateX(24px)',
              position: step === 2 ? 'relative' : 'absolute',
              inset: step === 2 ? 'auto' : 0,
              pointerEvents: step === 2 ? 'auto' : 'none',
            }}
          >
            <div className="flex flex-col gap-4">
              <Input
                id="signup-username"
                label="Username"
                value={form.username}
                onChange={set('username')}
                placeholder="johndoe"
                maxLength={20}
              />

              <Input
                id="signup-phone"
                type="tel"
                label="Phone Number"
                value={form.phone}
                onChange={set('phone')}
                placeholder="+1 234 567 8900"
              />

              <Input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                label="Password"
                value={form.password}
                onChange={set('password')}
                placeholder="Min 8 characters"
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
              />

              <div className="flex gap-3 mt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="flex-shrink-0 px-4"
                  onClick={() => setStep(1)}
                  aria-label="Go back"
                >
                  <ArrowLeft size={16} />
                </Button>
                <Button
                  id="signup-submit"
                  type="button"
                  size="lg"
                  className="flex-1"
                  loading={signupMutation.isPending}
                  disabled={!isStep2Valid}
                  onClick={handleSubmit}
                >
                  Create Account
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p
          className="mt-6 text-center text-[14px]"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Already have an account?{' '}
          <Link
            to="/login"
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
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}