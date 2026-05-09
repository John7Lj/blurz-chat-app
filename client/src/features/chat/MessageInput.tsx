/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

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
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
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
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 6,
        padding: '8px 10px',
        flexShrink: 0,
        background: 'var(--chat-input-bg)',
        borderTop: '1px solid var(--chat-border)',
      }}
    >
      {/* Attachment */}
      <button className="icon-btn" aria-label="Attach file">
        <Paperclip size={20} />
      </button>

      {/* Emoji */}
      <button className="icon-btn" aria-label="Emoji">
        <Smile size={20} />
      </button>

      {/* Textarea */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'flex-end',
          borderRadius: 20,
          padding: '6px 14px',
          background: 'var(--chat-search-bg)',
          border: '1px solid var(--chat-border)',
        }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your message"
          rows={1}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: 14,
            color: 'var(--chat-text-1)',
            resize: 'none',
            lineHeight: 1.4,
            maxHeight: 120,
            fontFamily: 'inherit',
          }}
        />
      </div>

      {/* Send */}
      <button
        onClick={handleSend}
        disabled={!hasContent}
        className={`send-btn ${hasContent ? 'has-content' : ''}`}
        aria-label="Send message"
      >
        <Send size={20} />
      </button>
    </div>
  );
}
