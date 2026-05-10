/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { chatService } from '../services/chat.service';
import { useUIStore } from '../store/ui.store';
import { queryClient } from '../lib/queryClient';
import type { ChatListItem } from '../types/chat.types';

export const CHATS_KEY = ['chats'] as const;

export function useChats() {
  return useQuery<ChatListItem[]>({
    queryKey: CHATS_KEY,
    queryFn: chatService.getMyChats,
  });
}

export function useStartChat() {
  const setActiveChat = useUIStore((s) => s.setActiveChat);

  return useMutation({
    mutationFn: ({ recipientId, message }: { recipientId: string; message: string }) =>
      chatService.startChat(recipientId, message),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: CHATS_KEY });
      setActiveChat(data.chat_id);
    },
  });
}

export function useDeleteChats() {
  return useMutation({
    mutationFn: (ids: string[]) => chatService.deleteChats(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHATS_KEY });
    },
  });
}
