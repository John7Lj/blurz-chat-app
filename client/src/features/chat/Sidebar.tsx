/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useState, useMemo, useCallback } from 'react';
import { PenSquare, MoreVertical, Search, X, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useChats } from '../../hooks/useChats';
import { useUIStore } from '../../store/ui.store';
import { useAuthStore } from '../../store/auth.store';
import { Avatar } from '../../components/ui/Avatar';
import { ChatListSkeleton } from '../../components/ui/Skeleton';
import ChatListItemComponent from './components/ChatListItem';
import { chatService } from '../../services/chat.service';

export default function Sidebar() {
  const { setActiveChat, openContactsPanel } = useUIStore();
  const activeChatId = useUIStore((s) => s.activeChatId);
  const userId = useAuthStore((s) => s.userId);
  const user = useAuthStore((s) => s.user);
  const { data: chats = [], isLoading } = useChats();
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedChatIds, setSelectedChatIds] = useState<string[]>([]);

  const deleteChatMutation = useMutation({
    mutationFn: (chatIds: string[]) => chatService.deleteChats(chatIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      toast.success('Chat(s) deleted');
      setIsSelectMode(false);
      setSelectedChatIds([]);
    },
    onError: () => {
      toast.error('Failed to delete chat(s)');
    },
  });

  const handleDeleteChat = useCallback((chatId: string) => {
    if (activeChatId === chatId) {
      setActiveChat(null as unknown as string);
    }
    deleteChatMutation.mutate([chatId]);
  }, [activeChatId, setActiveChat, deleteChatMutation]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedChatIds.length === 0) return;
    if (selectedChatIds.includes(activeChatId)) {
      setActiveChat(null as unknown as string);
    }
    deleteChatMutation.mutate(selectedChatIds);
  }, [selectedChatIds, activeChatId, setActiveChat, deleteChatMutation]);

  const sortedChats = useMemo(() => {
    return [...chats].sort((a, b) => {
      const timeA = a.last_message?.sent_at || a.created_at;
      const timeB = b.last_message?.sent_at || b.created_at;
      return new Date(timeB).getTime() - new Date(timeA).getTime();
    });
  }, [chats]);

  const filteredChats = useMemo(() => {
    if (!search.trim()) return sortedChats;
    const q = search.toLowerCase();
    return sortedChats.filter((c) => {
      const p = c.participants;
      if (!p) return false;
      const name = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase();
      if (name.includes(q)) return true;
      if (c.last_message?.content?.toLowerCase().includes(q)) return true;
      
      const msgs = queryClient.getQueryData<{content?: string | null}[]>(['messages', c.id]);
      if (msgs && msgs.some(m => m.content?.toLowerCase().includes(q))) return true;

      return false;
    });
  }, [sortedChats, search, queryClient]);

  const handleSelectChat = useCallback(
    (chatId: string) => {
      setActiveChat(chatId);
    },
    [setActiveChat],
  );

  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedChatIds([]);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedChatIds((prev) => 
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const fullName = `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim();

  return (
    <>
      {/* ── Header ──────── */}
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
        {isSelectMode ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="icon-btn" onClick={toggleSelectMode}><X size={20} /></button>
              <span style={{ fontSize: 15, fontWeight: 600 }}>{selectedChatIds.length} Selected</span>
            </div>
            <button 
              className="icon-btn" 
              onClick={handleDeleteSelected} 
              disabled={selectedChatIds.length === 0}
              style={{ color: selectedChatIds.length > 0 ? 'var(--color-danger)' : 'var(--chat-text-2)' }}
            >
              <Trash2 size={20} />
            </button>
          </>
        ) : (
          <>
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
                aria-label="Select chats"
                title="Select chats"
                onClick={toggleSelectMode}
              >
                <MoreVertical size={20} />
              </button>
            </div>
          </>
        )}
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
            placeholder="Search chats or messages..."
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
              {search ? 'No results found' : 'No conversations yet'}
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
              isActive={!isSelectMode && chat.id === activeChatId}
              onClick={() => handleSelectChat(chat.id)}
              onDelete={handleDeleteChat}
              currentUserId={userId ?? ''}
              isSelectMode={isSelectMode}
              isSelected={selectedChatIds.includes(chat.id)}
              onToggleSelect={handleToggleSelect}
            />
          ))}
      </div>
    </>
  );
}
