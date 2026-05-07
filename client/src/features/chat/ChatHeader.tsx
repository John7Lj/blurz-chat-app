import { ArrowLeft, Phone, Video, Search, MoreVertical } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';

interface ChatHeaderProps {
  name: string;
  avatarSrc?: string | null;
  isOnline?: boolean;
  lastSeen?: string;
  onBack: () => void;
}

export default function ChatHeader({ name, avatarSrc, isOnline = false, lastSeen, onBack }: ChatHeaderProps) {

  const statusText = isOnline ? 'online' : lastSeen || 'offline';
  const statusColor = isOnline ? 'var(--chat-green)' : 'var(--chat-text-2)';

  return (
    <header
      className="flex items-center gap-3 px-4 h-[60px] flex-shrink-0 border-b"
      style={{
        background: 'var(--chat-header-bg)',
        borderColor: 'var(--chat-border)',
      }}
    >
      {/* Back button (mobile) */}
      <button
        onClick={onBack}
        className="md:hidden w-9 h-9 flex items-center justify-center rounded-full transition-colors"
        style={{ color: 'var(--chat-text-2)' }}
        aria-label="Go back"
      >
        <ArrowLeft size={20} />
      </button>

      {/* Contact info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar src={avatarSrc} name={name} size="md" showOnline={isOnline} />
        <div className="flex-1 min-w-0">
          <h3
            className="text-[15px] font-semibold truncate leading-tight"
            style={{ color: 'var(--chat-text-1)' }}
          >
            {name}
          </h3>
          <p
            className="text-[13px] leading-tight mt-0.5"
            style={{ color: statusColor }}
          >
            {statusText}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => {}}
          className="w-10 h-10 flex items-center justify-center rounded-full transition-colors hover:bg-[var(--chat-hover)]"
          style={{ color: 'var(--chat-text-2)' }}
          aria-label="Video call"
        >
          <Video size={20} />
        </button>
        <button
          onClick={() => {}}
          className="w-10 h-10 flex items-center justify-center rounded-full transition-colors hover:bg-[var(--chat-hover)]"
          style={{ color: 'var(--chat-text-2)' }}
          aria-label="Voice call"
        >
          <Phone size={20} />
        </button>
        <button
          onClick={() => {}}
          className="w-10 h-10 flex items-center justify-center rounded-full transition-colors hover:bg-[var(--chat-hover)]"
          style={{ color: 'var(--chat-text-2)' }}
          aria-label="Search messages"
        >
          <Search size={20} />
        </button>
        <button
          onClick={() => {}}
          className="w-10 h-10 flex items-center justify-center rounded-full transition-colors hover:bg-[var(--chat-hover)]"
          style={{ color: 'var(--chat-text-2)' }}
          aria-label="More options"
        >
          <MoreVertical size={20} />
        </button>
      </div>
    </header>
  );
}
