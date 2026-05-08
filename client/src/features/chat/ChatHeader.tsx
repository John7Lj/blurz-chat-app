import { ArrowLeft, MoreVertical } from 'lucide-react';
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
  const statusColor = isOnline ? 'var(--color-success)' : 'var(--chat-text-2)';

  return (
    <header
      className="flex items-center justify-between px-3 h-[60px] flex-shrink-0"
      style={{
        background: 'var(--chat-header-bg)',
        borderBottom: '1px solid var(--chat-border)',
      }}
    >
      {/* Left side: back + avatar + info */}
      <div className="flex items-center gap-2.5">
        {/* Back arrow (always visible on mobile, vuetify-chat style) */}
        <button
          onClick={onBack}
          className="md:hidden w-8 h-8 flex items-center justify-center rounded-full transition-colors"
          style={{ color: 'var(--chat-text-2)' }}
          aria-label="Go back"
        >
          <ArrowLeft size={22} />
        </button>

        {/* Avatar with online status */}
        <Avatar src={avatarSrc} name={name} size="md" showOnline={isOnline} />

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <h3
            className="text-[15px] font-semibold truncate leading-tight"
            style={{ color: 'var(--chat-text-1)' }}
          >
            {name}
          </h3>
          <p
            className="text-[12px] leading-tight mt-0.5"
            style={{ color: statusColor }}
          >
            {statusText}
          </p>
        </div>
      </div>

      {/* Right side: menu button (vuetify-chat style — just dots menu) */}
      <button
        className="w-9 h-9 flex items-center justify-center rounded-full transition-colors"
        style={{ color: 'var(--chat-green)' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--chat-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        aria-label="More options"
      >
        <MoreVertical size={20} />
      </button>
    </header>
  );
}
