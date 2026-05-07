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
    <div className="flex h-full bg-[var(--color-bg-main)]">
      <div className="w-full max-w-4xl mx-auto flex flex-col p-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">Contacts</h1>
          <p className="text-[var(--color-text-secondary)]">Search for people to start a conversation</p>
        </header>

        <div className="glass-card flex-1 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[var(--color-border)]">
            <SearchBar
              value={query}
              onChange={setQuery}
              placeholder="Search by name or username..."
              autoFocus
            />
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {/* Initial state - no search yet */}
            {query.length < 2 && (
              <div className="p-12 text-center text-[var(--color-text-muted)] flex flex-col items-center animate-fade-in">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{
                    background: 'var(--color-bg-active)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <Search size={28} style={{ color: 'var(--color-accent)', opacity: 0.6 }} />
                </div>
                <p className="text-[15px] font-semibold text-[var(--color-text-primary)] mb-1">Find people</p>
                <p className="text-[13px] text-[var(--color-text-muted)]">Type at least 2 characters to search</p>
              </div>
            )}

            {/* Loading */}
            {query.length >= 2 && isLoading && (
              <div className="p-6 text-center text-[var(--color-text-muted)] animate-fade-in">
                <div className="w-8 h-8 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin mx-auto mb-3" />
                <p className="text-[13px]">Searching...</p>
              </div>
            )}

            {/* No results */}
            {query.length >= 2 && !isLoading && searchResults && searchResults.length === 0 && (
              <div className="p-12 text-center text-[var(--color-text-muted)] flex flex-col items-center animate-fade-in">
                <Search size={48} className="mb-4 opacity-20" />
                <p className="text-[15px] font-semibold text-[var(--color-text-primary)] mb-1">No users found</p>
                <p className="text-[13px]">Try a different name or username</p>
              </div>
            )}

            {/* Results */}
            {query.length >= 2 && !isLoading && searchResults && searchResults.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2 animate-fade-in">
                {searchResults.map(user => (
                  <button
                    key={user.id}
                    onClick={() => handleStartChat(user.id, `${user.first_name} ${user.last_name}`)}
                    disabled={startChatMutation.isPending}
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-[var(--color-bg-hover)] transition-all duration-150 border border-transparent hover:border-[var(--color-border)] cursor-pointer group text-left w-full"
                  >
                    <Avatar src={user.profile_url} name={`${user.first_name} ${user.last_name}`} size="lg" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent-light)] transition-colors truncate">
                        {user.first_name} {user.last_name}
                      </h3>
                      <p className="text-[13px] text-[var(--color-text-secondary)] truncate">@{user.username}</p>
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
    </div>
  );
}
