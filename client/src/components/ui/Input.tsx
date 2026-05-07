import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, rightIcon, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[13px] font-semibold"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {label}
          </label>
        )}

        <div className="relative group">
          {icon && (
            <span
              className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {icon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={[
              'w-full h-12 rounded-xl text-[14px] transition-all duration-200',
              'focus:outline-none',
              'placeholder:opacity-40',
              icon ? 'pl-10' : 'pl-4',
              rightIcon ? 'pr-11' : 'pr-4',
              className,
            ].join(' ')}
            style={{
              background: 'var(--color-bg-input)',
              color: 'var(--color-text-primary)',
              border: error
                ? '1px solid rgba(239,68,68,0.5)'
                : '1px solid var(--color-border)',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.15)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.border = error
                ? '1px solid rgba(239,68,68,0.7)'
                : '1px solid var(--color-border-focus)';
              e.currentTarget.style.boxShadow = error
                ? 'inset 0 1px 2px rgba(0,0,0,0.15), 0 0 0 3px rgba(239,68,68,0.1)'
                : 'inset 0 1px 2px rgba(0,0,0,0.15), 0 0 0 3px rgba(139,92,246,0.12)';
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              e.currentTarget.style.border = error
                ? '1px solid rgba(239,68,68,0.5)'
                : '1px solid var(--color-border)';
              e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.15)';
              props.onBlur?.(e);
            }}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p className="text-[12px] flex items-center gap-1" style={{ color: 'var(--color-danger)' }}>
            <span>⚠</span> {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
