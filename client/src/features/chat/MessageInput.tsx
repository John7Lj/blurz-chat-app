import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Smile, Paperclip, Mic } from 'lucide-react';

interface MessageInputProps {
  onSend: (text: string) => void;
  onTyping?: () => void;
}

export default function MessageInput({ onSend, onTyping }: MessageInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    onSend(text);
    setInput('');
    // Reset height
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

  const hasText = input.trim().length > 0;

  return (
    <div
      className="flex items-end gap-2 px-3 py-2.5 flex-shrink-0"
      style={{
        background: 'var(--chat-input-bg)',
        borderTop: '1px solid var(--chat-border)',
      }}
    >
      {/* Emoji button */}
      <button
        onClick={() => {}}
        className="w-10 h-10 flex items-center justify-center rounded-full transition-colors flex-shrink-0 hover:bg-[var(--chat-hover)]"
        style={{ color: 'var(--chat-text-2)' }}
        aria-label="Emoji"
      >
        <Smile size={22} />
      </button>

      {/* Attachment button */}
      <button
        onClick={() => {}}
        className="w-10 h-10 flex items-center justify-center rounded-full transition-colors flex-shrink-0 hover:bg-[var(--chat-hover)]"
        style={{ color: 'var(--chat-text-2)' }}
        aria-label="Attach file"
      >
        <Paperclip size={22} />
      </button>

      {/* Input field */}
      <div
        className="flex-1 rounded-xl px-4 py-2.5"
        style={{
          background: 'var(--chat-search-bg)',
          border: '1px solid var(--chat-border)',
        }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            onTyping?.();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type a message"
          rows={1}
          className="w-full bg-transparent text-[14.5px] resize-none focus:outline-none leading-relaxed placeholder:opacity-50"
          style={{
            color: 'var(--chat-text-1)',
            maxHeight: '120px',
          }}
        />
      </div>

      {/* Send / Mic button */}
      <div className="flex-shrink-0">
        {hasText ? (
          <button
            onClick={handleSend}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95"
            style={{ background: 'var(--chat-green)' }}
            aria-label="Send message"
          >
            <Send size={18} className="text-white translate-x-[1px]" />
          </button>
        ) : (
          <button
            onClick={() => {}}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-[var(--chat-hover)]"
            style={{ color: 'var(--chat-text-2)' }}
            aria-label="Voice message"
          >
            <Mic size={22} />
          </button>
        )}
      </div>
    </div>
  );
}
