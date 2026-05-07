import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-gradient-to-r from-violet-600 to-violet-500 text-white shadow-[0_4px_20px_rgba(109,40,217,0.35)] ' +
    'hover:shadow-[0_4px_28px_rgba(109,40,217,0.5)] hover:brightness-110 active:brightness-95',
  ghost:
    'bg-transparent text-[var(--color-text-secondary)] ' +
    'hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]',
  outline:
    'bg-transparent border border-[var(--color-border)] text-[var(--color-text-primary)] ' +
    'hover:bg-[var(--color-bg-hover)] hover:border-[var(--color-border-strong)]',
  danger:
    'bg-[rgba(239,68,68,0.1)] text-[var(--color-danger)] border border-[rgba(239,68,68,0.2)] ' +
    'hover:bg-[rgba(239,68,68,0.18)]',
};

const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-8  px-3.5 text-[12px] gap-1.5',
  md: 'h-10 px-5   text-[13px] gap-2',
  lg: 'h-12 px-6   text-[14px] gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, children, className = '', disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center font-medium rounded-xl',
        'transition-all duration-200 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/50',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
        variantStyles[variant],
        sizeStyles[size],
        className,
      ].join(' ')}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path
            className="opacity-80"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  ),
);

Button.displayName = 'Button';
