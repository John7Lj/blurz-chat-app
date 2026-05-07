import { z } from 'zod';

export const MessageSchema = z.object({
  id: z.string().uuid(),
  chat_id: z.string().uuid(),
  sender_id: z.string().uuid(),
  content: z.string().nullable().optional(),
  sent_at: z.string(),
  msg_type: z.enum(['text', 'file', 'image', 'video', 'audio', 'document']).optional().default('text'),
  status: z.enum(['sent', 'delivered', 'read']).optional().default('sent'),
  file_key: z.string().nullable().optional(),
  file_name: z.string().nullable().optional(),
});
export type Message = z.infer<typeof MessageSchema>;

// ── WebSocket Payloads ──────────────────────────────────────────────
export const WsIncomingMessageSchema = z.object({
  type: z.string(),
  chat_id: z.string().optional(),
  message_id: z.string().optional(),
  sender_id: z.string().optional(),
  content: z.string().optional(),
  sent_at: z.string().optional(),
  user_id: z.string().optional(),
});
export type WsIncomingMessage = z.infer<typeof WsIncomingMessageSchema>;

export const SendMessagePayloadSchema = z.object({
  type: z.literal('message').default('message'),
  chat_id: z.string().uuid(),
  content: z.string().min(1),
});
export type SendMessagePayload = z.infer<typeof SendMessagePayloadSchema>;
