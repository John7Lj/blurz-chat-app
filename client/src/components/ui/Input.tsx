/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {label && (
          <label
            htmlFor={inputId}
            style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}
          >
            {label}
          </label>
        )}

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {icon && (
            <div
              style={{
                position: 'absolute',
                left: 12,
                display: 'flex',
                alignItems: 'center',
                color: 'var(--color-text-muted)',
                pointerEvents: 'none',
              }}
            >
              {icon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={`input-field ${className}`}
            style={{
              paddingLeft: icon ? 38 : 14,
              paddingRight: rightIcon ? 38 : 14,
              borderColor: error ? 'var(--color-danger)' : undefined,
            }}
            {...props}
          />

          {rightIcon && (
            <div
              style={{
                position: 'absolute',
                right: 12,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p style={{ fontSize: 12, color: 'var(--color-danger)', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>⚠</span> {error}
          </p>
        )}
        {hint && !error && (
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
