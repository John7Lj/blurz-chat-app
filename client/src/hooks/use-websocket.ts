import { useEffect, useCallback } from 'react';
import { wsService } from '../services/ws.service';
import { useAuthStore } from '../stores/auth.store';
import { queryClient } from '../lib/query-client';
import { MESSAGES_KEY } from './use-messages';
import { CHATS_KEY } from './use-chats';
import type { Message } from '../schemas/message.schema';

export function useWebSocket() {
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.userId);

  useEffect(() => {
    if (!token) {
      wsService.disconnect();
      return;
    }

    wsService.connect(token);

    const unsubscribe = wsService.onMessage((data) => {
      const type = data.type as string;

      if (type === 'message' || type === 'message_ack') {
        const chatId = data.chat_id as string;
        const realId = (data.message_id as string) ?? (data.id as string);
        const tempId = data.temp_id as string | undefined;

        const msg: Message = {
          id: realId,
          chat_id: chatId,
          sender_id: data.sender_id as string,
          content: (data.content as string) ?? '',
          msg_type: 'text',
          status: (data.sender_id as string) === userId ? 'sent' : 'delivered',
          sent_at: (data.sent_at as string) ?? new Date().toISOString(),
        };

        // If we have no real ID yet (malformed ack), skip injecting
        if (!realId) return;

        // Inject into React Query cache:
        // - Replace the optimistic temp message if present
        // - Otherwise append, avoiding true duplicates
        queryClient.setQueryData<Message[]>(
          MESSAGES_KEY(chatId),
          (old = []) => {
            // Replace temp placeholder
            if (tempId) {
              const replaced = old.map((m) => (m.id === tempId ? msg : m));
              // If temp was found and replaced, return
              if (replaced.some((m) => m.id === realId)) return replaced;
            }
            // Avoid true duplicates (e.g. reconnect replay)
            if (old.some((m) => m.id === realId)) return old;
            return [...old, msg];
          },
        );

        // Invalidate chat list to refresh last_message
        queryClient.invalidateQueries({ queryKey: CHATS_KEY });
      }

      if (type === 'typing') {
        // Could emit to a typing indicator store later
      }

      if (type === 'read') {
        const chatId = data.chat_id as string;
        queryClient.invalidateQueries({ queryKey: MESSAGES_KEY(chatId) });
      }
    });

    return () => {
      unsubscribe();
      wsService.disconnect();
    };
  }, [token, userId]);

  const sendMessage = useCallback(
    (chatId: string, content: string) => {
      if (!userId) return;

      // ── Optimistic update: show message instantly ──────────────
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const optimisticMsg: Message = {
        id: tempId,
        chat_id: chatId,
        sender_id: userId,
        content,
        msg_type: 'text',
        status: 'sent',
        sent_at: new Date().toISOString(),
      };
      queryClient.setQueryData<Message[]>(
        MESSAGES_KEY(chatId),
        (old = []) => [...old, optimisticMsg],
      );

      wsService.send({
        type: 'message',
        chat_id: chatId,
        content,
        temp_id: tempId, // send temp_id so server can echo it back
      });
    },
    [userId],
  );

  const sendTyping = useCallback(
    (chatId: string) => {
      wsService.send({ type: 'typing', chat_id: chatId });
    },
    [],
  );

  return { sendMessage, sendTyping, isConnected: wsService.isConnected };
}
