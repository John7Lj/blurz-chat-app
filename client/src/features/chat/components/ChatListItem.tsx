/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Avatar } from '../../../components/ui/Avatar';
import type { ChatListItem } from '../../../types/chat.types';
import { formatDistanceToNow } from 'date-fns';
import { Check, CheckCheck, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface Props {
  chat: ChatListItem;
  isActive: boolean;
  onClick: () => void;
  onDelete?: (chatId: string) => void;
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

export default function ChatListItemComponent({ chat, isActive, onClick, onDelete, currentUserId }: Props) {
  const p = chat.participants;
  const name = `${p.first_name} ${p.last_name}`;
  const lastMsg = chat.last_message;
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  };

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

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startPress = (x: number, y: number) => {
    timerRef.current = setTimeout(() => {
      setMenuPos({ x, y });
      setShowMenu(true);
    }, 600); // 600ms for long press
  };

  const cancelPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <button
      data-testid="chat-list-item"
      data-active={isActive ? 'true' : 'false'}
      onClick={(e) => {
        if (showMenu) {
          setShowMenu(false);
          return;
        }
        onClick();
      }}
      onContextMenu={handleContextMenu}
      onTouchStart={(e) => {
        const touch = e.touches[0];
        startPress(touch.clientX, touch.clientY);
      }}
      onTouchEnd={cancelPress}
      onTouchMove={cancelPress}
      onMouseDown={(e) => {
        // Only for primary button long press if we wanted it on desktop too
        // but contextmenu usually handles right click on desktop
      }}
      onMouseUp={cancelPress}
      onMouseLeave={cancelPress}
      className="chat-list-item"
      style={{
        background: isActive ? 'var(--chat-selected)' : 'transparent',
        position: 'relative',
      }}
    >
      {/* Right-click context menu */}
      {showMenu && (
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            left: menuPos.x,
            top: menuPos.y,
            zIndex: 100,
            background: 'var(--color-bg-panel)',
            border: '1px solid var(--color-border)',
            borderRadius: 10,
            padding: '4px 0',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            minWidth: 160,
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(false);
              onDelete?.(chat.id);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              padding: '10px 14px',
              border: 'none',
              background: 'transparent',
              color: 'var(--color-danger)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <Trash2 size={15} />
            Delete Chat
          </button>
        </div>
      )}
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
