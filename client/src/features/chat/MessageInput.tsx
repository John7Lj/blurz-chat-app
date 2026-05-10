/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Smile, Paperclip } from 'lucide-react';
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react';
import { useUIStore } from '../../store/ui.store';

interface MessageInputProps {
  onSend: (text: string) => void;
  onTyping?: () => void;
}

export default function MessageInput({ onSend, onTyping }: MessageInputProps) {
  const [input, setInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const theme = useUIStore((s) => s.theme);

  // Close emoji picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setInput('');
    setShowEmojiPicker(false);
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

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setInput((prev) => prev + emojiData.emoji);
    if (textareaRef.current) {
      // Small timeout to allow state to update before focusing
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  };

  const hasContent = input.trim().length > 0;

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-end',
        gap: 6,
        padding: '8px 10px',
        flexShrink: 0,
        background: 'var(--chat-input-bg)',
        borderTop: '1px solid var(--chat-border)',
      }}
    >
      {/* Emoji Picker Overlay */}
      {showEmojiPicker && (
        <div 
          ref={pickerRef}
          style={{ 
            position: 'absolute', 
            bottom: '100%', 
            left: 10, 
            marginBottom: 10,
            zIndex: 50 
          }}
        >
          <EmojiPicker 
            theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
            onEmojiClick={onEmojiClick}
            lazyLoadEmojis={true}
          />
        </div>
      )}

      {/* Attachment */}
      <button className="icon-btn" aria-label="Attach file">
        <Paperclip size={20} />
      </button>

      {/* Emoji */}
      <button 
        className={`icon-btn ${showEmojiPicker ? 'text-violet-500' : ''}`} 
        aria-label="Emoji"
        onClick={() => setShowEmojiPicker((prev) => !prev)}
      >
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
