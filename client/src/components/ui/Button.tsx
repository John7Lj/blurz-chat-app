import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, children, className = '', disabled, ...props }, ref) => {
    
    // Base styles using CSS classes from index.css or simple objects
    const isPrimary = variant === 'primary';
    const isGhost = variant === 'ghost';
    const isOutline = variant === 'outline';
    const isDanger = variant === 'danger';

    const buttonClass = isPrimary ? 'btn-primary' : 'btn-base';

    const styles: React.CSSProperties = {
      height: size === 'sm' ? 32 : size === 'md' ? 40 : 48,
      padding: size === 'sm' ? '0 12px' : size === 'md' ? '0 16px' : '0 24px',
      fontSize: size === 'sm' ? 12 : 14,
      borderRadius: 10,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      fontWeight: 600,
      cursor: (disabled || loading) ? 'not-allowed' : 'pointer',
      opacity: (disabled || loading) ? 0.6 : 1,
      transition: 'all 0.15s ease',
      border: isOutline ? '1px solid var(--color-border)' : 'none',
      background: isPrimary ? 'var(--color-accent)' : isGhost ? 'transparent' : isOutline ? 'transparent' : isDanger ? 'rgba(239, 68, 68, 0.1)' : 'var(--color-bg-input)',
      color: isPrimary ? '#fff' : isDanger ? 'var(--color-danger)' : 'var(--color-text-primary)',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${className} ${isPrimary ? 'btn-primary' : ''}`}
        style={styles}
        {...props}
      >
        {loading && (
          <div
            className="animate-spin"
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              border: '2px solid currentColor',
              borderTopColor: 'transparent',
            }}
          />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
