import { MessageCircle, PenSquare } from 'lucide-react';
import { useUIStore } from '../../stores/ui.store';

export default function EmptyState() {
  const openContactsPanel = useUIStore((s) => s.openContactsPanel);

  return (
    <div className="flex flex-col items-center text-center px-6 py-8 animate-fade-in select-none">
      {/* Icon */}
      <div
        className="w-[72px] h-[72px] rounded-full flex items-center justify-center mb-5"
        style={{
          background: 'var(--chat-recv-bubble)',
          border: '1px solid var(--chat-border)',
        }}
      >
        <MessageCircle size={32} style={{ color: 'var(--chat-text-2)' }} />
      </div>

      <h3
        className="text-[20px] font-light mb-2"
        style={{ color: 'var(--chat-text-1)' }}
      >
        Blurz Chat
      </h3>
      <p
        className="text-[14px] max-w-[300px] leading-relaxed mb-6"
        style={{ color: 'var(--chat-text-2)' }}
      >
        Send and receive messages. Select a chat to get started.
      </p>

      <button
        onClick={openContactsPanel}
        className="inline-flex items-center gap-2 text-[13px] font-semibold px-5 py-2.5 rounded-full transition-all duration-150 active:scale-95"
        style={{
          color: '#FFFFFF',
          background: 'var(--chat-green)',
        }}
      >
        <PenSquare size={15} />
        Start a new chat
      </button>


    </div>
  );
}
