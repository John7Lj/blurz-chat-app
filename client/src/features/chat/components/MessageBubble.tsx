import { Check, CheckCheck, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { Message } from '../../../types/message.types';

interface Props {
  message: Message;
  isMine: boolean;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  showAvatar?: boolean;
  senderName?: string;
  senderAvatar?: string | null;
  onDelete?: (messageId: string) => void;
}

function formatTime(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function MessageBubble({ message, isMine, isLastInGroup = true, senderName, onDelete }: Props) {
  const time = formatTime(message.sent_at);
  const isRead = message.status === 'read';
  const isDelivered = message.status === 'delivered' || message.status === 'read';

  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  const startPress = (x: number, y: number) => {
    timerRef.current = setTimeout(() => {
      setMenuPos({ x, y });
      setShowMenu(true);
    }, 600);
  };

  const cancelPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <div
      data-testid="message-bubble"
      data-id={message.id}
      data-msg-id={message.id}
      data-mine={isMine ? 'true' : 'false'}
      style={{
        display: 'flex',
        justifyContent: isMine ? 'flex-end' : 'flex-start',
        padding: '2px 12px',
        position: 'relative',
      }}
    >
      {/* Context Menu */}
      {showMenu && (
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            left: menuPos.x,
            top: menuPos.y,
            zIndex: 1000,
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
              onDelete?.(message.id);
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
            Delete Message
          </button>
        </div>
      )}

      <div
        className={isMine
          ? `bubble-mine${isLastInGroup ? ' bubble-tail-mine' : ''}`
          : `bubble-other${isLastInGroup ? ' bubble-tail-other' : ''}`
        }
        onContextMenu={handleContextMenu}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          startPress(touch.clientX, touch.clientY);
        }}
        onTouchEnd={cancelPress}
        onTouchMove={cancelPress}
        onMouseUp={cancelPress}
        onMouseLeave={cancelPress}
        style={{
          position: 'relative',
          maxWidth: '75%',
          padding: '8px 12px',
          cursor: 'pointer',
        }}
      >
        {/* Sender name (partner messages) */}
        {!isMine && senderName && (
          <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 2, color: 'var(--color-accent-light)', margin: '0 0 2px 0' }}>
            {senderName}
          </p>
        )}

        {/* Content */}
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.45,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            margin: 0,
            color: isMine ? '#fff' : 'var(--chat-recv-text)',
          }}
        >
          {message.content}
        </p>

        {/* Time + status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            marginTop: 3,
            justifyContent: isMine ? 'flex-end' : 'flex-start',
          }}
        >
          <span style={{ fontSize: 11, color: isMine ? 'rgba(255,255,255,0.6)' : 'var(--chat-ts-recv)', userSelect: 'none' }}>
            {time}
          </span>
          {isMine && (
            <span style={{ marginLeft: 1 }}>
              {isRead
                ? <CheckCheck size={14} style={{ color: '#93c5fd' }} />
                : isDelivered
                  ? <CheckCheck size={14} style={{ color: 'rgba(255,255,255,0.5)' }} />
                  : <Check size={14} style={{ color: 'rgba(255,255,255,0.5)' }} />
              }
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
