import { useState, useMemo, useCallback } from 'react';
import { PenSquare, MoreVertical, Search } from 'lucide-react';
import { useChats } from '../../hooks/use-chats';
import { useUIStore } from '../../stores/ui.store';
import { useAuthStore } from '../../stores/auth.store';
import { Avatar } from '../../components/ui/Avatar';
import { ChatListSkeleton } from '../../components/ui/Skeleton';
import ChatListItemComponent from '../../components/ChatListItem';

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
      {/* ── Header (60px — vuetify-chat MenuPanel style) ────────── */}
      <header
        className="flex items-center justify-between px-3 h-[60px] flex-shrink-0"
        style={{
          background: 'var(--chat-header-bg)',
          borderBottom: '1px solid var(--chat-border)',
        }}
      >
        {/* Left: Avatar */}
        <div className="flex items-center gap-2.5">
          <Avatar src={user?.profile_url} name={fullName} size="md" />
        </div>

        {/* Right: Action icons (vuetify-chat style) */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => openContactsPanel()}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
            style={{ color: 'var(--chat-text-2)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--chat-green)';
              e.currentTarget.style.background = 'var(--chat-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--chat-text-2)';
              e.currentTarget.style.background = 'transparent';
            }}
            aria-label="New chat"
            title="New Chat"
          >
            <PenSquare size={20} />
          </button>
          <button
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
            style={{ color: 'var(--chat-text-2)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--chat-green)';
              e.currentTarget.style.background = 'var(--chat-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--chat-text-2)';
              e.currentTarget.style.background = 'transparent';
            }}
            aria-label="Menu"
            title="Menu"
          >
            <MoreVertical size={20} />
          </button>
        </div>
      </header>

      {/* ── Search bar ────────────────────────────────────────────── */}
      <div className="px-2 py-2 flex-shrink-0" style={{ background: 'var(--chat-sidebar-bg)' }}>
        <div
          className="flex items-center gap-2 rounded-full px-3 h-[36px]"
          style={{ background: 'var(--chat-search-bg)' }}
        >
          <Search size={16} style={{ color: 'var(--chat-text-2)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search or start new chat"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[13px] focus:outline-none placeholder:opacity-60"
            style={{ color: 'var(--chat-text-1)' }}
            aria-label="Search or start new chat"
          />
        </div>
      </div>

      {/* ── Chat list (scrollable) ────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto py-1"
        style={{ background: 'var(--chat-sidebar-bg)' }}
      >
        {isLoading && (
          <div className="space-y-0">
            {Array.from({ length: 7 }).map((_, i) => (
              <ChatListSkeleton key={i} />
            ))}
          </div>
        )}

        {!isLoading && filteredChats.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in">
            <p
              className="text-[14px] font-medium"
              style={{ color: 'var(--chat-text-2)' }}
            >
              {search ? 'No chats found' : 'No conversations yet'}
            </p>
            <p
              className="text-[12px] mt-1"
              style={{ color: 'var(--chat-text-2)', opacity: 0.7 }}
            >
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
