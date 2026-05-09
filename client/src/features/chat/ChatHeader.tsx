/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

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

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        height: 60,
        flexShrink: 0,
        background: 'var(--chat-header-bg)',
        borderBottom: '1px solid var(--chat-border)',
      }}
    >
      {/* Left: back + avatar + info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Back arrow — only on mobile */}
        <button
          onClick={onBack}
          className="icon-btn mobile-only"
          aria-label="Go back"
        >
          <ArrowLeft size={22} />
        </button>

        <Avatar src={avatarSrc} name={name} size="md" showOnline={isOnline} />

        <div style={{ minWidth: 0 }}>
          <h3
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--chat-text-1)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.3,
              margin: 0,
            }}
          >
            {name}
          </h3>
          <p
            style={{
              fontSize: 12,
              lineHeight: 1.3,
              marginTop: 1,
              margin: 0,
              color: isOnline ? 'var(--color-success)' : 'var(--chat-text-2)',
            }}
          >
            {statusText}
          </p>
        </div>
      </div>

      {/* Right: menu */}
      <button className="icon-btn" aria-label="More options">
        <MoreVertical size={20} />
      </button>
    </header>
  );
}
