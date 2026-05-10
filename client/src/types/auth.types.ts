/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { z } from 'zod';

// ── Login ───────────────────────────────────────────────────────────
export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const LoginResponseSchema = z.object({
  access_token: z.string(),
  user_id: z.string(),
  username: z.string(),
  email: z.string(),
  phone: z.string().optional(),
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

// ── Signup ──────────────────────────────────────────────────────────
export const SignupSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Please enter a valid email address'),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number (e.g., +1234567890)'),
  first_name: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be at most 50 characters')
    .regex(/^[a-zA-Z\s\-']+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),
  last_name: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be at most 50 characters')
    .regex(/^[a-zA-Z\s\-']+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters'),
  profile_picture: z.string().nullable().optional(),
});
export type SignupInput = z.infer<typeof SignupSchema>;

// ── Token Refresh ───────────────────────────────────────────────────
export const RefreshResponseSchema = z.object({
  access_token: z.string(),
});
export type RefreshResponse = z.infer<typeof RefreshResponseSchema>;
