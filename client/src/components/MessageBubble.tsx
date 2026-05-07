import { format } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';
import type { Message } from '../schemas/message.schema';
import { Avatar } from './ui/Avatar';

interface Props {
  message: Message;
  isMine: boolean;
  isLastInGroup: boolean;
  isFirstInGroup: boolean;
  showAvatar?: boolean;
  senderName?: string;
  senderAvatar?: string | null;
}

export default function MessageBubble({
  message,
  isMine,
  isLastInGroup,
  isFirstInGroup,
  showAvatar = false,
  senderName,
  senderAvatar,
}: Props) {
  let time = '';
  try {
    time = format(new Date(message.sent_at), 'HH:mm');
  } catch {
    time = '';
  }

  const status = message.status || 'read';

  // Bubble border-radius: 8px default, 2px on the tail corner for last-in-group
  const sentRadius = isLastInGroup
    ? 'rounded-[8px] rounded-br-[2px]'
    : 'rounded-[8px]';
  const recvRadius = isLastInGroup
    ? 'rounded-[8px] rounded-bl-[2px]'
    : 'rounded-[8px]';

  // Spacing: more space between groups, tight within a group
  const topMargin = isFirstInGroup ? 'mt-3' : 'mt-[3px]';

  return (
    <div
      data-testid="message-bubble"
      data-id={message.id}
      data-mine={isMine ? 'true' : 'false'}
      className={`flex ${isMine ? 'justify-end' : 'justify-start'} px-[4%] ${topMargin} animate-msg-in`}
    >
      {/* Avatar for received messages — only on last message in group */}
      {!isMine && (
        <div className="w-[28px] mr-2 flex-shrink-0 self-end">
          {showAvatar ? (
            <Avatar src={senderAvatar} name={senderName} size="xs" />
          ) : null}
        </div>
      )}

      {/* Bubble */}
      <div
        className={`relative max-w-[65%] px-3 pt-[7px] pb-[10px] shadow-sm ${
          isMine ? sentRadius : recvRadius
        } ${isLastInGroup ? (isMine ? 'bubble-tail-sent' : 'bubble-tail-recv') : ''}`}
        style={{
          background: isMine ? 'var(--chat-sent-bubble)' : 'var(--chat-recv-bubble)',
        }}
      >
        <p
          data-testid="bubble-text"
          className="text-[14.5px] leading-[20px] break-words whitespace-pre-wrap"
          style={{ color: isMine ? 'var(--chat-sent-text)' : 'var(--chat-recv-text)' }}
        >
          {message.content}
          {/* Invisible spacer so text wraps around the timestamp */}
          <span className="invisible text-[11px] ml-2 inline-block w-[60px]">
            {isMine ? '00:00 ✓✓' : '00:00'}
          </span>
        </p>

        {/* Timestamp + read receipt */}
        <span
          data-testid="bubble-timestamp"
          className="absolute bottom-[6px] right-[8px] flex items-center gap-1"
          style={{ color: isMine ? 'var(--chat-ts-sent)' : 'var(--chat-ts-recv)' }}
        >
          <span className="text-[11px] leading-none">{time}</span>
          {isMine && (
            <span
              data-testid="read-receipt"
              data-receipt={status}
              className="ml-[1px]"
            >
              {status === 'read' ? (
                <CheckCheck size={16} style={{ color: 'var(--chat-tick-read)' }} />
              ) : status === 'delivered' ? (
                <CheckCheck size={16} style={{ color: 'var(--chat-tick-sent)' }} />
              ) : (
                <Check size={16} style={{ color: 'var(--chat-tick-sent)' }} />
              )}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
