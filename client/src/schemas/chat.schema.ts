import { z } from 'zod';
import { ContactUserSchema } from './user.schema';

export const ParticipantSchema = z.object({
  user_id: z.string().uuid(),
  first_name: z.string(),
  last_name: z.string(),
  profile_url: z.string().nullable().optional(),
});
export type Participant = z.infer<typeof ParticipantSchema>;

export const LastMessagePreviewSchema = z.object({
  content: z.string().nullable().optional(),
  msg_type: z.string(),
  sender_id: z.string(),
  sent_at: z.string(),
});
export type LastMessagePreview = z.infer<typeof LastMessagePreviewSchema>;

export const ChatListItemSchema = z.object({
  id: z.string().uuid(),
  created_at: z.string(),
  participants: ParticipantSchema,
  last_message: LastMessagePreviewSchema.nullable().optional(),
});
export type ChatListItem = z.infer<typeof ChatListItemSchema>;

export const MessageOutSchema = z.object({
  id: z.string().uuid(),
  content: z.string().nullable().optional(),
  sender_id: z.string().uuid(),
  chat_id: z.string().uuid(),
  sent_at: z.string(),
});
export type MessageOut = z.infer<typeof MessageOutSchema>;

export const StartChatRequestSchema = z.object({
  recipient_id: z.string().uuid(),
  message: z.string().min(1),
});
export type StartChatRequest = z.infer<typeof StartChatRequestSchema>;

export const StartChatResponseSchema = z.object({
  chat_id: z.string().uuid(),
  is_new: z.boolean(),
  message: MessageOutSchema,
});
export type StartChatResponse = z.infer<typeof StartChatResponseSchema>;
