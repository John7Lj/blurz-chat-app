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

  let timeAgo = '';
  if (lastMsg?.sent_at) {
    try {
      timeAgo = formatDistanceToNow(new Date(lastMsg.sent_at), { addSuffix: false });
      timeAgo = timeAgo
        .replace('about ', '')
        .replace(' hours', 'h')
        .replace(' hour', 'h')
        .replace(' minutes', 'm')
        .replace(' minute', 'm')
        .replace(' days', 'd')
        .replace(' day', 'd');
    } catch {
      timeAgo = '';
    }
  }

  // Derive read status from last message's status field
  const lastMsgStatus = (lastMsg as Record<string, unknown>)?.status as string | undefined;
  const isRead = lastMsgStatus === 'read';
  const isDelivered = lastMsgStatus === 'delivered' || lastMsgStatus === 'read';

  // Unread count — will come from server when available; for now derive from status
  const unreadCount = (chat as Record<string, unknown>).unread_count as number | undefined ?? 0;

  return (
    <button
      data-testid="chat-list-item"
      data-active={isActive ? 'true' : 'false'}
      onClick={onClick}
      className="w-full flex items-center gap-3 text-left transition-all duration-150 group relative"
      style={{
        height: '72px',
        /* always reserve 3px for the left border so content never shifts */
        padding: isActive ? '10px 12px 10px 9px' : '10px 12px',
        background: isActive ? 'var(--chat-selected)' : 'transparent',
        borderLeft: isActive ? '3px solid var(--chat-green)' : '3px solid transparent',
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = 'var(--chat-hover)';
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = 'transparent';
      }}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <Avatar src={p.profile_url} name={name} size="md" showOnline={true} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 border-b py-[5px]" style={{ borderColor: 'var(--chat-border)' }}>
        <div className="flex items-center justify-between gap-2">
          <span
            data-testid="contact-name"
            className="text-[15px] font-semibold truncate"
            style={{ color: 'var(--chat-text-1)' }}
          >
            {name}
          </span>
          {timeAgo && (
            <span
              className="text-[11px] flex-shrink-0"
              style={{ color: unreadCount > 0 ? 'var(--chat-green)' : 'var(--chat-text-2)' }}
            >
              {timeAgo}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p
            data-testid="last-message"
            className="text-[13px] truncate flex-1"
            style={{ color: 'var(--chat-text-2)' }}
          >
            {isMe && lastMsg && (
              <span className="inline-flex items-center mr-1 align-middle">
                {isRead ? (
                  <CheckCheck size={16} style={{ color: 'var(--chat-tick-read)' }} />
                ) : isDelivered ? (
                  <CheckCheck size={16} style={{ color: 'var(--chat-tick-sent)' }} />
                ) : (
                  <Check size={16} style={{ color: 'var(--chat-tick-sent)' }} />
                )}
              </span>
            )}
            {preview}
          </p>

          {unreadCount > 0 && (
            <span
              data-testid="unread-badge"
              className="min-w-[20px] h-[20px] rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 px-1"
              style={{ background: 'var(--chat-green)' }}
            >
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
