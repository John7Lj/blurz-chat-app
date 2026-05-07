import type { ChatListItem } from '../../schemas/chat.schema';
import type { Message } from '../../schemas/message.schema';

// ── Users ───────────────────────────────────────────────────────────
export const CURRENT_USER_ID = '00000000-0000-0000-0000-000000000001';

export const mockParticipant = (overrides?: Partial<ChatListItem['participants']>) => ({
  user_id: '00000000-0000-0000-0000-000000000002',
  first_name: 'Alice',
  last_name: 'Johnson',
  profile_url: null,
  ...overrides,
});

// ── Chats ───────────────────────────────────────────────────────────
export const mockChat = (overrides?: Partial<ChatListItem>): ChatListItem => ({
  id: '10000000-0000-0000-0000-000000000001',
  created_at: '2026-05-01T10:00:00Z',
  participants: mockParticipant(),
  last_message: {
    content: 'Hey, how are you?',
    msg_type: 'text',
    sender_id: '00000000-0000-0000-0000-000000000002',
    sent_at: new Date().toISOString(),
  },
  ...overrides,
});

export const mockChats: ChatListItem[] = [
  mockChat({
    id: '10000000-0000-0000-0000-000000000001',
    participants: mockParticipant({ first_name: 'Alice', last_name: 'Johnson' }),
    last_message: { content: 'Hey there!', msg_type: 'text', sender_id: '00000000-0000-0000-0000-000000000002', sent_at: new Date().toISOString() },
  }),
  mockChat({
    id: '10000000-0000-0000-0000-000000000002',
    participants: mockParticipant({ user_id: '00000000-0000-0000-0000-000000000003', first_name: 'Bob', last_name: 'Smith' }),
    last_message: { content: 'See you tomorrow', msg_type: 'text', sender_id: CURRENT_USER_ID, sent_at: '2026-05-06T14:00:00Z' },
  }),
  mockChat({
    id: '10000000-0000-0000-0000-000000000003',
    participants: mockParticipant({ user_id: '00000000-0000-0000-0000-000000000004', first_name: 'Charlie', last_name: 'Brown' }),
    last_message: null,
  }),
  mockChat({
    id: '10000000-0000-0000-0000-000000000004',
    participants: mockParticipant({ user_id: '00000000-0000-0000-0000-000000000005', first_name: 'Diana', last_name: 'Prince' }),
    last_message: { content: 'Thanks for the update on the project!', msg_type: 'text', sender_id: '00000000-0000-0000-0000-000000000005', sent_at: '2026-05-01T09:00:00Z' },
  }),
];

// ── Messages ────────────────────────────────────────────────────────
export const mockMessage = (overrides?: Partial<Message>): Message => ({
  id: '20000000-0000-0000-0000-000000000001',
  chat_id: '10000000-0000-0000-0000-000000000001',
  sender_id: '00000000-0000-0000-0000-000000000002',
  content: 'Hello!',
  sent_at: '2026-05-07T10:00:00Z',
  msg_type: 'text',
  status: 'read',
  ...overrides,
});

export const mockMessages: Message[] = [
  mockMessage({
    id: '20000000-0000-0000-0000-000000000001',
    content: 'Hey, how are you doing?',
    sender_id: '00000000-0000-0000-0000-000000000002',
    sent_at: '2026-05-07T09:00:00Z',
    status: 'read',
  }),
  mockMessage({
    id: '20000000-0000-0000-0000-000000000002',
    content: "I'm doing great, thanks for asking!",
    sender_id: CURRENT_USER_ID,
    sent_at: '2026-05-07T09:01:00Z',
    status: 'read',
  }),
  mockMessage({
    id: '20000000-0000-0000-0000-000000000003',
    content: 'Want to grab lunch later?',
    sender_id: '00000000-0000-0000-0000-000000000002',
    sent_at: '2026-05-07T09:02:00Z',
    status: 'delivered',
  }),
  mockMessage({
    id: '20000000-0000-0000-0000-000000000004',
    content: 'Sure! How about noon?',
    sender_id: CURRENT_USER_ID,
    sent_at: '2026-05-07T09:03:00Z',
    status: 'sent',
  }),
];

// ── WebSocket payloads ──────────────────────────────────────────────
export const wsIncomingMessage = (chatId: string, content: string) => ({
  type: 'message',
  chat_id: chatId,
  message_id: crypto.randomUUID(),
  sender_id: '00000000-0000-0000-0000-000000000002',
  content,
  sent_at: new Date().toISOString(),
});

export const wsTypingPayload = (chatId: string) => ({
  type: 'typing',
  chat_id: chatId,
  user_id: '00000000-0000-0000-0000-000000000002',
});

export const wsReadPayload = (chatId: string) => ({
  type: 'read',
  chat_id: chatId,
  user_id: '00000000-0000-0000-0000-000000000002',
});
