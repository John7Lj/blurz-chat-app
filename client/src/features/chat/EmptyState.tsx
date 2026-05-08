import { MessageCircle, PenSquare } from 'lucide-react';
import { useUIStore } from '../../stores/ui.store';

export default function EmptyState() {
  const openContactsPanel = useUIStore((s) => s.openContactsPanel);

  return (
    <div className="flex flex-col items-center text-center px-6 py-8 animate-fade-in select-none">
      {/* Icon — simple circle like vuetify-chat */}
      <div
        className="w-[80px] h-[80px] rounded-full flex items-center justify-center mb-5"
        style={{
          background: 'var(--color-accent-muted)',
          border: '1px solid var(--color-border)',
        }}
      >
        <MessageCircle size={36} style={{ color: 'var(--color-accent-light)' }} />
      </div>

      <h3
        className="text-[22px] font-light mb-2"
        style={{ color: 'var(--chat-text-1)' }}
      >
        Blurz Chat
      </h3>
      <p
        className="text-[14px] max-w-[320px] leading-relaxed mb-6"
        style={{ color: 'var(--chat-text-2)' }}
      >
        Send and receive messages without needing a phone connection.
        Select a conversation or start a new one.
      </p>

      <button
        onClick={openContactsPanel}
        className="inline-flex items-center gap-2 text-[14px] font-semibold px-6 py-2.5 rounded-full transition-all duration-150 active:scale-95"
        style={{
          color: '#FFFFFF',
          background: 'var(--color-accent)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-accent-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-accent)')}
      >
        <PenSquare size={16} />
        Start a new chat
      </button>
    </div>
  );
}
