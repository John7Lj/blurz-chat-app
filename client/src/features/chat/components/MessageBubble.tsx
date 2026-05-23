import { Check, CheckCheck, Trash2, MoreVertical, Edit2, X as XIcon } from 'lucide-react';
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
  onEdit?: (messageId: string, newContent: string) => void;
}

function formatTime(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function MessageBubble({ message, isMine, isLastInGroup = true, senderName, onDelete, onEdit }: Props) {
  const time = formatTime(message.sent_at);
  const isRead = message.status === 'read';
  const isDelivered = message.status === 'delivered' || message.status === 'read';

  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content || '');
  const menuRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);

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

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.setSelectionRange(editText.length, editText.length);
    }
  }, [isEditing]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  };

  const handleDotsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({ x: rect.left, y: rect.bottom + 4 });
    setShowMenu(true);
  };

  const handleStartEdit = () => {
    setShowMenu(false);
    setEditText(message.content || '');
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    const trimmed = editText.trim();
    if (!trimmed || trimmed === message.content) {
      setIsEditing(false);
      return;
    }
    onEdit?.(message.id, trimmed);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText(message.content || '');
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    }
    if (e.key === 'Escape') {
      handleCancelEdit();
    }
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
        alignItems: 'center',
        gap: 4,
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
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
            background: 'var(--color-bg-panel, var(--chat-header-bg))',
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
          
          {isMine && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStartEdit();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '10px 14px',
                border: 'none',
                background: 'transparent',
                color: 'var(--color-text-primary, var(--chat-text-1))',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-hover, rgba(139,92,246,0.07))')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <Edit2 size={15} />
              Edit Message
            </button>
          )}
        </div>
      )}

      {!isMine && isHovering && !isEditing && (
        <button onClick={handleDotsClick} className="icon-btn" style={{ width: 28, height: 28, flexShrink: 0 }}>
          <MoreVertical size={16} />
        </button>
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

        {/* Content — editable or static */}
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 }}>
            <textarea
              ref={editInputRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleEditKeyDown}
              rows={1}
              style={{
                fontSize: 14,
                lineHeight: 1.45,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                margin: 0,
                color: '#fff',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 6,
                padding: '4px 8px',
                outline: 'none',
                resize: 'none',
                fontFamily: 'inherit',
              }}
            />
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              <button
                onClick={handleCancelEdit}
                style={{
                  padding: '3px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.7)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                style={{
                  padding: '3px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  border: 'none',
                  background: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                Save
              </button>
            </div>
          </div>
        ) : (
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
        )}

        {/* Time + status */}
        {!isEditing && (
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
        )}
      </div>

      {isMine && isHovering && !isEditing && (
        <button onClick={handleDotsClick} className="icon-btn" style={{ width: 28, height: 28, flexShrink: 0 }}>
          <MoreVertical size={16} />
        </button>
      )}
    </div>
  );
}
