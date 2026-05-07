import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { ChevronDown } from 'lucide-react';
import type { Message } from '../../schemas/message.schema';
import MessageBubble from '../../components/MessageBubble';
import DateDivider from './DateDivider';

interface MessageListProps {
  messages: Message[];
  currentUserId: string | null;
  participantName?: string;
  participantAvatar?: string | null;
  isLoading?: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────

function getDateLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isToday(d)) return 'Today';
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'EEE, d MMM');
  } catch {
    return '';
  }
}

/** Check if two dates are the same calendar day */
function isSameDay(a: string, b: string): boolean {
  try {
    const da = new Date(a);
    const db = new Date(b);
    return (
      da.getFullYear() === db.getFullYear() &&
      da.getMonth() === db.getMonth() &&
      da.getDate() === db.getDate()
    );
  } catch {
    return false;
  }
}

/** Two messages are in the same group if same sender & within 5 min */
function inSameGroup(a: Message, b: Message): boolean {
  if (a.sender_id !== b.sender_id) return false;
  try {
    const diff = Math.abs(new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime());
    return diff <= 5 * 60 * 1000;
  } catch {
    return false;
  }
}

// ── Component ─────────────────────────────────────────────────────

export default function MessageList({
  messages,
  currentUserId,
  participantName,
  participantAvatar,
  isLoading,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newMsgCount, setNewMsgCount] = useState(0);
  const prevLenRef = useRef(messages.length);

  // ── Scroll tracking ───────────────────────────────────────────
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const threshold = 80;
    const atBot = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    setIsAtBottom(atBot);
    if (atBot) setNewMsgCount(0);
  }, []);

  // Auto-scroll to bottom on new message (if user is at bottom)
  useEffect(() => {
    const newLen = messages.length;
    if (newLen > prevLenRef.current) {
      if (isAtBottom) {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      } else {
        setNewMsgCount((c) => c + (newLen - prevLenRef.current));
      }
    }
    prevLenRef.current = newLen;
  }, [messages.length, isAtBottom]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'instant' });
    }
  }, [isLoading, messages.length === 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setNewMsgCount(0);
  }, []);

  // ── Render items with date dividers and grouping ──────────────
  const renderItems = useMemo(() => {
    const items: React.ReactNode[] = [];
    let lastDate = '';

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const dateLabel = getDateLabel(msg.sent_at);

      // Insert date divider
      if (i === 0 || !isSameDay(msg.sent_at, messages[i - 1].sent_at)) {
        lastDate = dateLabel;
        items.push(<DateDivider key={`date-${lastDate}-${i}`} label={lastDate} />);
      }

      // Determine grouping
      const prev = i > 0 ? messages[i - 1] : null;
      const next = i < messages.length - 1 ? messages[i + 1] : null;

      const isFirstInGroup = !prev || !inSameGroup(prev, msg) || !isSameDay(prev.sent_at, msg.sent_at);
      const isLastInGroup = !next || !inSameGroup(msg, next) || !isSameDay(msg.sent_at, next.sent_at);

      const isMine = msg.sender_id === currentUserId;
      const showAvatar = !isMine && isLastInGroup;

      items.push(
        <MessageBubble
          key={msg.id}
          message={msg}
          isMine={isMine}
          isFirstInGroup={isFirstInGroup}
          isLastInGroup={isLastInGroup}
          showAvatar={showAvatar}
          senderName={participantName}
          senderAvatar={participantAvatar}
        />,
      );
    }

    return items;
  }, [messages, currentUserId, participantName, participantAvatar]);

  // ── Loading skeleton ─────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto chat-bg-pattern p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`flex ${i % 3 === 0 ? 'justify-end' : 'justify-start'} px-[4%] py-1`}
          >
            <div
              className={`h-9 ${i % 3 === 0 ? 'w-36' : 'w-52'} rounded-[8px] skeleton`}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      data-testid="message-list"
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto chat-bg-pattern relative pt-2 pb-4"
    >
      {/* Empty state */}
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full gap-3">
          <div
            className="px-4 py-2 rounded-lg text-[13px] font-medium shadow-sm"
            style={{
              background: 'var(--chat-divider-bg)',
              color: 'var(--chat-divider-text)',
            }}
          >
            💬 Say hello! Start the conversation.
          </div>
        </div>
      )}

      {renderItems}
      <div ref={bottomRef} />

      {/* "New messages" floating button */}
      {newMsgCount > 0 && !isAtBottom && (
        <button
          onClick={scrollToBottom}
          className="sticky bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-[13px] font-semibold shadow-lg flex items-center gap-1.5 transition-all z-10 hover:brightness-110"
          style={{
            background: 'var(--chat-header-bg)',
            color: 'var(--chat-green)',
            border: '1px solid var(--chat-border)',
          }}
        >
          {newMsgCount} new message{newMsgCount > 1 ? 's' : ''} <ChevronDown size={16} />
        </button>
      )}
    </div>
  );
}
