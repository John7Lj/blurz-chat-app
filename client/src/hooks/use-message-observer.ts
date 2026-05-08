import { useEffect, useRef, useCallback } from 'react';

interface UseMessageObserverOptions {
  /** The scroll container element */
  containerRef: React.RefObject<HTMLElement | null>;
  /** All messages in the chat */
  messages: { id: string; sender_id: string; status?: string }[];
  /** Current user's ID */
  currentUserId: string | null;
  /** Chat ID */
  chatId: string | null;
  /** Callback when a message becomes visible and should be marked as read */
  onMessageRead: (chatId: string, messageId: string) => void;
}

/**
 * IntersectionObserver hook that detects when received (non-own) messages
 * scroll into view and marks them as read via WebSocket.
 *
 * Ported from vuetify-chat-master's observerStore pattern:
 * - Only observes received messages (not own messages)
 * - Unobserves after marking read (one-shot)
 * - Anchored to the message list scroll container
 */
export function useMessageObserver({
  containerRef,
  messages,
  currentUserId,
  chatId,
  onMessageRead,
}: UseMessageObserverOptions) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const observedIdsRef = useRef<Set<string>>(new Set());
  // Keep a stable ref to onMessageRead to avoid re-creating observer
  const onReadRef = useRef(onMessageRead);
  onReadRef.current = onMessageRead;

  const chatIdRef = useRef(chatId);
  chatIdRef.current = chatId;

  // Cleanup function
  const cleanup = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    observedIdsRef.current.clear();
  }, []);

  useEffect(() => {
    if (!containerRef.current || !chatId || !currentUserId) {
      cleanup();
      return;
    }

    // Create observer anchored to the scroll container
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;

          const msgId = entry.target.getAttribute('data-msg-id');
          if (!msgId || !chatIdRef.current) continue;

          // Unobserve immediately (one-shot per message)
          observerRef.current?.unobserve(entry.target);
          observedIdsRef.current.delete(msgId);

          // Fire read receipt
          onReadRef.current(chatIdRef.current, msgId);
        }
      },
      {
        root: containerRef.current,
        threshold: 0.8, // Message must be 80% visible
      },
    );

    return cleanup;
  }, [chatId, currentUserId, containerRef, cleanup]);

  // Observe new unread received messages whenever messages change
  useEffect(() => {
    const observer = observerRef.current;
    const container = containerRef.current;
    if (!observer || !container || !currentUserId) return;

    // Find received messages that haven't been observed yet
    for (const msg of messages) {
      // Skip own messages
      if (msg.sender_id === currentUserId) continue;
      // Skip already observed
      if (observedIdsRef.current.has(msg.id)) continue;
      // Skip temp messages
      if (msg.id.startsWith('temp-')) continue;

      // Find the DOM element for this message
      const el = container.querySelector(`[data-msg-id="${msg.id}"]`);
      if (el) {
        observer.observe(el);
        observedIdsRef.current.add(msg.id);
      }
    }
  }, [messages, currentUserId, containerRef]);
}
