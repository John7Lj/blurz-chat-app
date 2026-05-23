/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Smile, Paperclip, Mic, X, Loader2 } from 'lucide-react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { useUIStore } from '../../store/ui.store';

interface MessageInputProps {
  onSend: (text: string) => void;
  onTyping?: () => void;
  onFileUpload?: (file: File) => Promise<void>;
}

const ACCEPTED_FILE_TYPES = 'image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt';

export default function MessageInput({ onSend, onTyping, onFileUpload }: MessageInputProps) {
  const [input, setInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
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

  const onEmojiClick = (emojiData: { emoji: string }) => {
    setInput((prev) => prev + emojiData.emoji);
    if (textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  };

  // ── File upload ───────────────────────────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onFileUpload) return;
    e.target.value = ''; // reset so same file can be re-selected

    setIsUploading(true);
    try {
      await onFileUpload(file);
    } finally {
      setIsUploading(false);
    }
  };

  // ── Voice recording ──────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });
        
        if (onFileUpload) {
          setIsUploading(true);
          try {
            await onFileUpload(file);
          } finally {
            setIsUploading(false);
          }
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
    } catch {
      // User denied mic permission or not available
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      // Stop mic
      mediaRecorderRef.current.stream?.getTracks().forEach(t => t.stop());
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
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
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_FILE_TYPES}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

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

      {isRecording ? (
        /* ── Recording mode ─────────────────────────────────── */
        <>
          <button className="icon-btn" onClick={cancelRecording} aria-label="Cancel recording" style={{ color: 'var(--color-danger)' }}>
            <X size={20} />
          </button>
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 14px',
            borderRadius: 20,
            background: 'var(--chat-search-bg)',
            border: '1px solid var(--chat-border)',
          }}>
            <div style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#ef4444',
              animation: 'pulse 1s infinite',
            }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--chat-text-1)' }}>
              {formatRecordingTime(recordingTime)}
            </span>
            <span style={{ fontSize: 13, color: 'var(--chat-text-2)' }}>Recording...</span>
          </div>
          <button
            onClick={stopRecording}
            className="send-btn has-content"
            aria-label="Stop and send"
          >
            <Send size={20} />
          </button>
        </>
      ) : (
        /* ── Normal mode ────────────────────────────────────── */
        <>
          {/* Attachment */}
          <button 
            className="icon-btn" 
            aria-label="Attach file"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Paperclip size={20} />}
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

          {/* Send or Mic */}
          {hasContent ? (
            <button
              onClick={handleSend}
              className="send-btn has-content"
              aria-label="Send message"
            >
              <Send size={20} />
            </button>
          ) : (
            <button
              onClick={startRecording}
              className="icon-btn"
              aria-label="Record voice note"
              style={{ color: 'var(--color-accent)' }}
            >
              <Mic size={20} />
            </button>
          )}
        </>
      )}
    </div>
  );
}
