/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useState, useMemo, useCallback } from 'react';
import { PenSquare, MoreVertical, Search } from 'lucide-react';
import { useChats } from '../../hooks/useChats';
import { useUIStore } from '../../store/ui.store';
import { useAuthStore } from '../../store/auth.store';
import { Avatar } from '../../components/ui/Avatar';
import { ChatListSkeleton } from '../../components/ui/Skeleton';
import ChatListItemComponent from './components/ChatListItem';

export default function Sidebar() {
  const { setActiveChat, openContactsPanel } = useUIStore();
  const activeChatId = useUIStore((s) => s.activeChatId);
  const userId = useAuthStore((s) => s.userId);
  const user = useAuthStore((s) => s.user);
  const { data: chats = [], isLoading } = useChats();
  const [search, setSearch] = useState('');

  const filteredChats = useMemo(() => {
    if (!search.trim()) return chats;
    const q = search.toLowerCase();
    return chats.filter((c) => {
      const p = c.participants;
      if (!p) return false;
      const name = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase();
      return name.includes(q);
    });
  }, [chats, search]);

  const handleSelectChat = useCallback(
    (chatId: string) => {
      setActiveChat(chatId);
    },
    [setActiveChat],
  );

  const fullName = `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim();

  return (
    <>
      {/* ── Header (vuetify-chat MenuPanel style — 60px) ──────── */}
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
        {/* Left: Avatar */}
        <Avatar src={user?.profile_url} name={fullName} size="md" />

        {/* Right: Action icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={openContactsPanel}
            className="icon-btn"
            aria-label="New chat"
            title="New Chat"
          >
            <PenSquare size={20} />
          </button>
          <button
            className="icon-btn"
            aria-label="Menu"
            title="Menu"
          >
            <MoreVertical size={20} />
          </button>
        </div>
      </header>

      {/* ── Search bar ──────────────────────────────────────────── */}
      <div
        style={{
          padding: '8px 10px',
          flexShrink: 0,
          background: 'var(--chat-sidebar-bg)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderRadius: 9999,
            padding: '0 12px',
            height: 36,
            background: 'var(--chat-search-bg)',
          }}
        >
          <Search size={15} style={{ color: 'var(--chat-text-2)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search or start new chat"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 13,
              color: 'var(--chat-text-1)',
            }}
            aria-label="Search chats"
          />
        </div>
      </div>

      {/* ── Chat list (scrollable) ───────────────────────────────── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          background: 'var(--chat-sidebar-bg)',
          paddingTop: 4,
          paddingBottom: 4,
        }}
      >
        {isLoading &&
          Array.from({ length: 7 }).map((_, i) => <ChatListSkeleton key={i} />)
        }

        {!isLoading && filteredChats.length === 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px 24px',
              textAlign: 'center',
            }}
            className="animate-fade-in"
          >
            <p style={{ fontSize: 14, color: 'var(--chat-text-2)', fontWeight: 500 }}>
              {search ? 'No chats found' : 'No conversations yet'}
            </p>
            <p style={{ fontSize: 12, marginTop: 4, color: 'var(--chat-text-2)', opacity: 0.7 }}>
              {search ? 'Try a different search' : 'Start a new chat to begin'}
            </p>
          </div>
        )}

        {!isLoading &&
          filteredChats.map((chat) => (
            <ChatListItemComponent
              key={chat.id}
              chat={chat}
              isActive={chat.id === activeChatId}
              onClick={() => handleSelectChat(chat.id)}
              currentUserId={userId ?? ''}
            />
          ))}
      </div>
    </>
  );
}
