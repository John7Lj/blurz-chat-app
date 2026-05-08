import { MessageCircle, PenSquare } from 'lucide-react';
import { useUIStore } from '../../stores/ui.store';

export default function EmptyState() {
  const openContactsPanel = useUIStore((s) => s.openContactsPanel);

  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '40px 24px',
        userSelect: 'none',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
          background: 'var(--color-accent-muted)',
          border: '1px solid var(--color-border)',
        }}
      >
        <MessageCircle size={36} style={{ color: 'var(--color-accent-light)' }} />
      </div>

      <h3 style={{ fontSize: 22, fontWeight: 300, color: 'var(--chat-text-1)', margin: '0 0 8px 0' }}>
        Blurz Chat
      </h3>
      <p style={{ fontSize: 14, maxWidth: 300, lineHeight: 1.5, color: 'var(--chat-text-2)', margin: '0 0 24px 0' }}>
        Send and receive messages. Select a conversation or start a new one.
      </p>

      <button
        onClick={openContactsPanel}
        className="btn-primary"
        style={{ width: 'auto', padding: '0 24px', borderRadius: 9999 }}
      >
        <PenSquare size={16} />
        Start a new chat
      </button>
    </div>
  );
}
