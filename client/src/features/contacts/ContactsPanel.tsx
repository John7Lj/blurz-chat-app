/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { X, MessageCircle } from 'lucide-react';
import { useUIStore } from '../../stores/ui.store';
import { useSearchUsers } from '../../hooks/use-contacts';
import { useStartChat } from '../../hooks/use-chats';
import { Avatar } from '../../components/ui/Avatar';
import { SearchBar } from '../../components/ui/SearchBar';
import { Skeleton } from '../../components/ui/Skeleton';

export function ContactsPanel() {
  const closeContactsPanel = useUIStore((s) => s.closeContactsPanel);
  const { query, setQuery, data: searchResults, isLoading } = useSearchUsers();
  const startChatMutation = useStartChat();

  const displayList = query.length >= 2 ? (searchResults ?? []) : [];
  const isSearching = query.length >= 2 && isLoading;

  const handleSelect = (userId: string) => {
    startChatMutation.mutate(
      { recipientId: userId, message: '👋' },
      { onSuccess: () => closeContactsPanel() },
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 animate-fade-in"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
        onClick={closeContactsPanel}
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 bottom-0 w-full max-w-sm z-50 flex flex-col animate-slide-in-right"
        style={{
          background: 'var(--color-bg-secondary)',
          borderLeft: '1px solid var(--color-border)',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header */}
        <header
          className="flex items-center justify-between px-4 h-[60px] flex-shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <h2
            className="text-[15px] font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            New Conversation
          </h2>
          <button
            onClick={closeContactsPanel}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-bg-hover)';
              e.currentTarget.style.color = 'var(--color-text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--color-text-muted)';
            }}
          >
            <X size={17} />
          </button>
        </header>

        {/* Search */}
        <div className="px-4 py-2.5">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search by name or username…"
            autoFocus
          />
        </div>

        {/* Section label */}
        <div className="px-4 pb-1 pt-0.5">
          <p
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {query.length >= 2 ? 'Search results' : 'Type to search'}
          </p>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isSearching && (
            <div className="space-y-1 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-0 py-2">
                  <Skeleton variant="circle" className="w-10 h-10 flex-shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-2.5 w-16 opacity-60" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty / initial state */}
          {!isSearching && displayList.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                style={{
                  background: 'var(--color-bg-active)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <MessageCircle size={22} style={{ color: 'var(--color-accent)' }} />
              </div>
              <p
                className="text-[14px] font-semibold mb-1"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {query.length >= 2 ? 'No users found' : 'Find someone'}
              </p>
              <p className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
                {query.length >= 2 ? 'Try a different name' : 'Search for someone to chat with'}
              </p>
            </div>
          )}

          {!isSearching &&
            displayList.map((user) => (
              <button
                key={user.id}
                onClick={() => handleSelect(user.id)}
                disabled={startChatMutation.isPending}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150"
                style={{ color: 'inherit' }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'var(--color-bg-hover)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'transparent')
                }
              >
                <Avatar
                  src={user.profile_url}
                  name={`${user.first_name} ${user.last_name}`}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[13px] font-semibold truncate"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {user.first_name} {user.last_name}
                  </p>
                  <p
                    className="text-[12px] truncate"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    @{user.username}
                  </p>
                </div>
              </button>
            ))}
        </div>
      </div>
    </>
  );
}
