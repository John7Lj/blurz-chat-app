/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useMemo } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { ChevronDown } from 'lucide-react';
import type { Message } from '../../types/message.types';
import MessageBubble from './components/MessageBubble';
import DateDivider from './DateDivider';
import { useMessageObserver } from '../../hooks/useMessageObserver';
import { useMessageList } from './hooks/useMessageList';

interface MessageListProps {
  messages: Message[];
  currentUserId: string | null;
  participantName?: string;
  participantAvatar?: string | null;
  isLoading?: boolean;
  chatId?: string | null;
  onMessageRead?: (chatId: string, messageId: string) => void;
}

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

function isSameDay(a: string, b: string): boolean {
  try {
    const da = new Date(a);
    const db = new Date(b);
    return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
  } catch {
    return false;
  }
}

function inSameGroup(a: Message, b: Message): boolean {
  if (a.sender_id !== b.sender_id) return false;
  try {
    const diff = Math.abs(new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime());
    return diff <= 5 * 60 * 1000;
  } catch {
    return false;
  }
}

export default function MessageList({
  messages,
  currentUserId,
  participantName,
  participantAvatar,
  isLoading,
  chatId,
  onMessageRead,
}: MessageListProps) {
  const {
    containerRef,
    bottomRef,
    isAtBottom,
    newMsgCount,
    handleScroll,
    scrollToBottom,
  } = useMessageList({ messages, isLoading });

  useMessageObserver({
    containerRef,
    messages,
    currentUserId,
    chatId: chatId ?? null,
    onMessageRead: onMessageRead ?? (() => {}),
  });

  const renderItems = useMemo(() => {
    const items: React.ReactNode[] = [];
    let lastDate = '';

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const dateLabel = getDateLabel(msg.sent_at);

      if (i === 0 || !isSameDay(msg.sent_at, messages[i - 1].sent_at)) {
        lastDate = dateLabel;
        items.push(<DateDivider key={`date-${lastDate}-${i}`} label={lastDate} />);
      }

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

  if (isLoading) {
    return (
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, background: 'var(--chat-msg-bg)' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: i % 3 === 0 ? 'flex-end' : 'flex-start',
              padding: '4px 16px',
            }}
          >
            <div
              className="skeleton"
              style={{ height: 36, width: i % 3 === 0 ? 140 : 200, borderRadius: 8 }}
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
      className="chat-bg-pattern"
      style={{
        flex: 1,
        overflowY: 'auto',
        position: 'relative',
        paddingTop: 8,
        paddingBottom: 16,
      }}
    >
      {messages.length === 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: 12,
          }}
        >
          <div
            style={{
              padding: '6px 16px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
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

      {/* New messages floating button */}
      {newMsgCount > 0 && !isAtBottom && (
        <button
          onClick={scrollToBottom}
          style={{
            position: 'sticky',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '8px 16px',
            borderRadius: 9999,
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--chat-header-bg)',
            color: 'var(--chat-green)',
            border: '1px solid var(--chat-border)',
            cursor: 'pointer',
            zIndex: 10,
          }}
        >
          {newMsgCount} new {newMsgCount > 1 ? 'messages' : 'message'} <ChevronDown size={16} />
        </button>
      )}
    </div>
  );
}
