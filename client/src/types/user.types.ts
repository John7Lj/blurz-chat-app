/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  email: z.string().email(),
  phone: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  is_verified: z.boolean(),
  profile_url: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});
export type User = z.infer<typeof UserSchema>;

export const ContactUserSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  profile_url: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
});
export type ContactUser = z.infer<typeof ContactUserSchema>;

export const UpdateUserSchema = z.object({
  username: z.string().max(20).optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
});
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
