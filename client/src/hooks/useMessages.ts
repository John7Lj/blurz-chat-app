/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useQuery } from '@tanstack/react-query';
import { messageService } from '../services/message.service';
import type { Message } from '../types/message.types';

export const MESSAGES_KEY = (chatId: string) => ['messages', chatId] as const;

export function useMessages(chatId: string | null) {
  return useQuery<Message[]>({
    queryKey: chatId ? MESSAGES_KEY(chatId) : ['messages', 'none'],
    queryFn: () => messageService.getMessages(chatId!),
    enabled: !!chatId,
  });
}
