import { useEffect, useCallback, useRef } from 'react';
import { wsService } from '../services/ws.service';
import { useAuthStore } from '../stores/auth.store';
import { useUIStore } from '../stores/ui.store';
import { queryClient } from '../lib/query-client';
import { MESSAGES_KEY } from './use-messages';
import { CHATS_KEY } from './use-chats';
import type { Message } from '../schemas/message.schema';

export function useWebSocket() {
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.userId);

  // Debounce timer ref for sendTyping
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (!token) {
      wsService.disconnect();
      return;
    }

    wsService.connect(token);

    const unsubscribe = wsService.onMessage((data) => {
      const type = data.type as string;

      // ── New message or message acknowledgment ──────────────────
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

        // Clear typing indicator when a message arrives from that chat
        useUIStore.getState().clearTyping(chatId);

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

      // ── Typing indicator ──────────────────────────────────────
      if (type === 'typing') {
        const chatId = data.chat_id as string;
        const typingUserId = (data.user_id as string) ?? (data.sender_id as string);
        // Don't show our own typing indicator
        if (typingUserId && typingUserId !== userId && chatId) {
          useUIStore.getState().setTyping(chatId, typingUserId);
        }
      }

      // ── Read receipt ──────────────────────────────────────────
      if (type === 'read') {
        const chatId = data.chat_id as string;
        const readMessageId = data.message_id as string;
        const readByUserId = (data.user_id as string) ?? (data.sender_id as string);

        // Only update if someone ELSE read OUR messages
        if (readByUserId && readByUserId !== userId && chatId) {
          queryClient.setQueryData<Message[]>(
            MESSAGES_KEY(chatId),
            (old = []) =>
              old.map((m) => {
                // Mark our sent/delivered messages as read
                // up to and including the read message
                if (
                  m.sender_id === userId &&
                  m.status !== 'read'
                ) {
                  // If we have a specific message_id, mark all messages up to it
                  // For simplicity, mark all our unread messages as read
                  // (the server guarantees ordering)
                  return { ...m, status: 'read' as const };
                }
                return m;
              }),
          );

          // Also refresh chat list to update read status indicators
          queryClient.invalidateQueries({ queryKey: CHATS_KEY });
        }
      }

      // ── New chat created ──────────────────────────────────────
      if (type === 'new_chat') {
        queryClient.invalidateQueries({ queryKey: CHATS_KEY });
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

      // Clear our own typing state
      isTypingRef.current = false;
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }
    },
    [userId],
  );

  // Debounced typing — sends at most once per second (like vuetify-chat's meTyping)
  const sendTyping = useCallback(
    (chatId: string) => {
      if (isTypingRef.current) return; // already sent recently

      isTypingRef.current = true;
      wsService.send({ type: 'typing', chat_id: chatId });

      // Reset after 1 second to allow sending again
      typingTimerRef.current = setTimeout(() => {
        isTypingRef.current = false;
      }, 1000);
    },
    [],
  );

  // Send a read receipt for a specific message
  const sendRead = useCallback(
    (chatId: string, messageId: string) => {
      wsService.send({
        type: 'read',
        chat_id: chatId,
        message_id: messageId,
      });
    },
    [],
  );

  return { sendMessage, sendTyping, sendRead, isConnected: wsService.isConnected };
}
