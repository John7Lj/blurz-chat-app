/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Avatar } from './ui/Avatar';
import type { ChatListItem } from '../schemas/chat.schema';
import { formatDistanceToNow } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';

interface Props {
  chat: ChatListItem;
  isActive: boolean;
  onClick: () => void;
  currentUserId: string;
}

function formatTime(dateStr: string): string {
  try {
    const t = formatDistanceToNow(new Date(dateStr), { addSuffix: false });
    return t
      .replace('about ', '')
      .replace(' hours', 'h').replace(' hour', 'h')
      .replace(' minutes', 'm').replace(' minute', 'm')
      .replace(' days', 'd').replace(' day', 'd');
  } catch {
    return '';
  }
}

export default function ChatListItemComponent({ chat, isActive, onClick, currentUserId }: Props) {
  const p = chat.participants;
  const name = `${p.first_name} ${p.last_name}`;
  const lastMsg = chat.last_message;

  let preview = 'No messages yet';
  let isMe = false;
  if (lastMsg?.content) {
    isMe = lastMsg.sender_id === currentUserId;
    preview = isMe ? `You: ${lastMsg.content}` : lastMsg.content;
  }

  const timeAgo = lastMsg?.sent_at ? formatTime(lastMsg.sent_at) : '';
  const lastMsgStatus = (lastMsg as Record<string, unknown>)?.status as string | undefined;
  const isRead = lastMsgStatus === 'read';
  const isDelivered = lastMsgStatus === 'delivered' || lastMsgStatus === 'read';
  const unreadCount = (chat as Record<string, unknown>).unread_count as number | undefined ?? 0;

  return (
    <button
      data-testid="chat-list-item"
      data-active={isActive ? 'true' : 'false'}
      onClick={onClick}
      className="chat-list-item"
      style={{
        background: isActive ? 'var(--chat-selected)' : 'transparent',
      }}
    >
      {/* Avatar */}
      <div style={{ flexShrink: 0 }}>
        <Avatar src={p.profile_url} name={name} size="md" showOnline />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span
            data-testid="contact-name"
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--chat-text-1)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {name}
          </span>
          {timeAgo && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                flexShrink: 0,
                color: unreadCount > 0 ? 'var(--chat-green)' : 'var(--chat-text-2)',
              }}
            >
              {timeAgo}
            </span>
          )}
        </div>

        {/* Bottom row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 2 }}>
          <p
            data-testid="last-message"
            style={{
              fontSize: 13,
              color: 'var(--chat-text-2)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
              margin: 0,
            }}
          >
            {isMe && lastMsg && (
              <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: 4, verticalAlign: 'middle' }}>
                {isRead
                  ? <CheckCheck size={13} style={{ color: '#93c5fd' }} />
                  : isDelivered
                    ? <CheckCheck size={13} style={{ color: 'var(--chat-tick-sent)' }} />
                    : <Check size={13} style={{ color: 'var(--chat-tick-sent)' }} />
                }
              </span>
            )}
            {preview}
          </p>

          {unreadCount > 0 && (
            <span
              data-testid="unread-badge"
              className="badge"
              style={{ flexShrink: 0 }}
            >
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
