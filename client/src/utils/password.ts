/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/** Represents the result of a password strength calculation. */
export interface PasswordStrengthResult {
  level: number;
  label: string;
  color: string;
}

/** The total number of strength segments displayed in the UI. */
export const PASSWORD_STRENGTH_SEGMENTS = 4;

/**
 * Calculates the strength of a password based on length, character
 * variety, and special characters. Returns a level (0–4), a label,
 * and a color for the strength indicator.
 */
export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password) return { level: 0, label: '', color: 'transparent' };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) return { level: 1, label: 'Weak', color: '#ef4444' };
  if (score <= 2) return { level: 2, label: 'Fair', color: '#f59e0b' };
  if (score <= 3) return { level: 3, label: 'Good', color: '#3b82f6' };
  return { level: 4, label: 'Strong', color: '#22c55e' };
}
