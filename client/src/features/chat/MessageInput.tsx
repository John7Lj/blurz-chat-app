import { useState, useRef, useCallback } from 'react';
import { Send, Smile, Paperclip } from 'lucide-react';

interface MessageInputProps {
  onSend: (text: string) => void;
  onTyping?: () => void;
}

export default function MessageInput({ onSend, onTyping }: MessageInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setInput('');
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  // Auto-grow textarea
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      onTyping?.();

      const el = e.target;
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    },
    [onTyping],
  );

  const hasContent = input.trim().length > 0;

  return (
    <div
      className="flex items-end gap-2 px-3 py-2.5 flex-shrink-0"
      style={{
        background: 'var(--chat-input-bg)',
        borderTop: '1px solid var(--chat-border)',
      }}
    >
      {/* Attachment button */}
      <button
        className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full transition-colors"
        style={{ color: 'var(--chat-text-2)' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--chat-green)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--chat-text-2)')}
        aria-label="Attach file"
      >
        <Paperclip size={20} />
      </button>

      {/* Emoji button */}
      <button
        className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full transition-colors"
        style={{ color: 'var(--chat-text-2)' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--chat-green)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--chat-text-2)')}
        aria-label="Emoji"
      >
        <Smile size={20} />
      </button>

      {/* Text input — vuetify-chat style textarea */}
      <div
        className="flex-1 flex items-end rounded-2xl px-4 py-2"
        style={{
          background: 'var(--chat-search-bg)',
          border: '1px solid var(--chat-border)',
        }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your text"
          rows={1}
          className="flex-1 bg-transparent text-[14px] focus:outline-none resize-none leading-[1.4] placeholder:opacity-50"
          style={{
            color: 'var(--chat-text-1)',
            maxHeight: '120px',
          }}
        />
      </div>

      {/* Send button — vuetify-chat style */}
      <button
        onClick={handleSend}
        disabled={!hasContent}
        className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full transition-all duration-150"
        style={{
          background: hasContent ? 'var(--color-accent)' : 'transparent',
          color: hasContent ? '#fff' : 'var(--chat-text-2)',
          transform: 'rotate(-5deg)',
          cursor: hasContent ? 'pointer' : 'default',
        }}
        onMouseEnter={(e) => {
          if (hasContent) e.currentTarget.style.background = 'var(--color-accent-hover)';
        }}
        onMouseLeave={(e) => {
          if (hasContent) e.currentTarget.style.background = 'var(--color-accent)';
        }}
        aria-label="Send message"
      >
        <Send size={20} />
      </button>
    </div>
  );
}
