import { Check, CheckCheck } from 'lucide-react';
import type { Message } from '../schemas/message.schema';

interface Props {
  message: Message;
  isMine: boolean;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  showAvatar?: boolean;
  senderName?: string;
  senderAvatar?: string | null;
}

function formatTime(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function MessageBubble({ message, isMine, isLastInGroup = true, senderName }: Props) {
  const time = formatTime(message.sent_at);
  const isRead = message.status === 'read';
  const isDelivered = message.status === 'delivered' || message.status === 'read';

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
      }}
    >
      <div
        className={isMine
          ? `bubble-mine${isLastInGroup ? ' bubble-tail-mine' : ''}`
          : `bubble-other${isLastInGroup ? ' bubble-tail-other' : ''}`
        }
        style={{
          position: 'relative',
          maxWidth: '75%',
          padding: '8px 12px',
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
