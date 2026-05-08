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

export default function MessageBubble({
  message,
  isMine,
  isLastInGroup = true,
  senderName,
}: Props) {
  const time = formatTime(message.sent_at);
  const isRead = message.status === 'read';
  const isDelivered = message.status === 'delivered' || message.status === 'read';
  const topMargin = 'mt-[3px]';

  return (
    <div
      data-testid="message-bubble"
      data-id={message.id}
      data-msg-id={message.id}
      data-mine={isMine ? 'true' : 'false'}
      className={`flex ${isMine ? 'justify-end' : 'justify-start'} px-3 ${topMargin}`}
    >
      <div
        className={`relative max-w-[85%] sm:max-w-[65%] md:max-w-[50%] px-4 py-2 ${
          isMine
            ? `bubble-mine ${isLastInGroup ? 'bubble-tail-mine' : ''}`
            : `bubble-other ${isLastInGroup ? 'bubble-tail-other' : ''}`
        }`}
      >
        {/* Sender name for partner messages (first in group) */}
        {!isMine && senderName && (
          <p className="text-[12px] font-semibold mb-0.5" style={{ color: 'var(--color-accent-light)' }}>
            {senderName}
          </p>
        )}

        {/* Message content */}
        <p
          className="text-[14px] leading-relaxed whitespace-pre-wrap break-words"
          style={{ color: isMine ? '#fff' : 'var(--chat-recv-text)' }}
        >
          {message.content}
        </p>

        {/* Timestamp + read status */}
        <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : ''}`}>
          <span
            className="text-[11px]"
            style={{ color: isMine ? 'rgba(255,255,255,0.65)' : 'var(--chat-ts-recv)', userSelect: 'none' }}
          >
            {time}
          </span>
          {isMine && (
            <span className="ml-0.5">
              {isRead ? (
                <CheckCheck size={15} style={{ color: '#93c5fd' }} />
              ) : isDelivered ? (
                <CheckCheck size={15} style={{ color: 'rgba(255,255,255,0.5)' }} />
              ) : (
                <Check size={15} style={{ color: 'rgba(255,255,255,0.5)' }} />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
