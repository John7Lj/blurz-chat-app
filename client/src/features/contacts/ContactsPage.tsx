/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Search, MessageCircle } from 'lucide-react';
import { useSearchUsers } from '../../hooks/use-contacts';
import { useStartChat } from '../../hooks/use-chats';
import { useNavigate } from 'react-router';
import { Avatar } from '../../components/ui/Avatar';
import { SearchBar } from '../../components/ui/SearchBar';

export default function ContactsPage() {
  const navigate = useNavigate();
  const { query, setQuery, data: searchResults, isLoading } = useSearchUsers();
  const startChatMutation = useStartChat();

  const handleStartChat = (userId: string, name: string) => {
    startChatMutation.mutate(
      { recipientId: userId, message: '👋' },
      {
        onSuccess: () => {
          navigate('/chat');
        },
      },
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--color-bg-main)' }}>
      {/* ── Consistent 60px page header ────────────────────────── */}
      <header
        className="flex items-center justify-between px-5 h-[60px] flex-shrink-0 border-b"
        style={{
          background: 'var(--color-bg-panel)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div>
          <h1 className="text-[17px] font-bold" style={{ color: 'var(--color-text-primary)' }}>Contacts</h1>
        </div>
      </header>

      {/* ── Search bar (same height as chat sidebar search) ──── */}
      <div className="px-3 py-2 flex-shrink-0" style={{ background: 'var(--color-bg-panel)', borderBottom: '1px solid var(--color-border)' }}>
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search by name or username..."
          autoFocus
        />
      </div>

      {/* ── Results area (scrollable) ─────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full max-w-4xl mx-auto p-2">
          {/* Initial state - no search yet */}
          {query.length < 2 && (
            <div className="p-12 text-center flex flex-col items-center animate-fade-in" style={{ color: 'var(--color-text-muted)' }}>
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{
                  background: 'var(--color-bg-active)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <Search size={28} style={{ color: 'var(--color-accent)', opacity: 0.6 }} />
              </div>
              <p className="text-[15px] font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>Find people</p>
              <p className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>Type at least 2 characters to search</p>
            </div>
          )}

          {/* Loading */}
          {query.length >= 2 && isLoading && (
            <div className="p-6 text-center animate-fade-in" style={{ color: 'var(--color-text-muted)' }}>
              <div
                className="w-8 h-8 rounded-full border-2 animate-spin mx-auto mb-3"
                style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}
              />
              <p className="text-[13px]">Searching...</p>
            </div>
          )}

          {/* No results */}
          {query.length >= 2 && !isLoading && searchResults && searchResults.length === 0 && (
            <div className="p-12 text-center flex flex-col items-center animate-fade-in" style={{ color: 'var(--color-text-muted)' }}>
              <Search size={48} className="mb-4 opacity-20" />
              <p className="text-[15px] font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>No users found</p>
              <p className="text-[13px]">Try a different name or username</p>
            </div>
          )}

          {/* Results */}
          {query.length >= 2 && !isLoading && searchResults && searchResults.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1 p-2 animate-fade-in">
              {searchResults.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleStartChat(user.id, `${user.first_name} ${user.last_name}`)}
                  disabled={startChatMutation.isPending}
                  className="flex items-center gap-4 p-4 rounded-xl transition-all duration-150 cursor-pointer group text-left w-full"
                  style={{ border: '1px solid transparent' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--color-bg-hover)';
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                >
                  <Avatar src={user.profile_url} name={`${user.first_name} ${user.last_name}`} size="lg" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {user.first_name} {user.last_name}
                    </h3>
                    <p className="text-[13px] truncate" style={{ color: 'var(--color-text-secondary)' }}>@{user.username}</p>
                  </div>
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                    style={{ background: 'var(--color-accent-muted)' }}
                  >
                    <MessageCircle size={16} style={{ color: 'var(--color-accent-light)' }} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
