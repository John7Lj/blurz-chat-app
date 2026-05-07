import { useQuery } from '@tanstack/react-query';
import { messageService } from '../services/message.service';
import type { Message } from '../schemas/message.schema';

export const MESSAGES_KEY = (chatId: string) => ['messages', chatId] as const;

export function useMessages(chatId: string | null) {
  return useQuery<Message[]>({
    queryKey: chatId ? MESSAGES_KEY(chatId) : ['messages', 'none'],
    queryFn: () => messageService.getMessages(chatId!),
    enabled: !!chatId,
  });
}
