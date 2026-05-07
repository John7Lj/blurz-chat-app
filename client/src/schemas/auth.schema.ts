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
  username: z.string().min(1).max(20),
  email: z.string().email(),
  phone: z.string().min(1),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  password: z.string().min(8).max(72),
  profile_picture: z.string().nullable().optional(),
});
export type SignupInput = z.infer<typeof SignupSchema>;

// ── Token Refresh ───────────────────────────────────────────────────
export const RefreshResponseSchema = z.object({
  access_token: z.string(),
});
export type RefreshResponse = z.infer<typeof RefreshResponseSchema>;
