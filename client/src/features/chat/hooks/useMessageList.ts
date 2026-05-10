/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import type { Message } from '../../../types/message.types';

interface UseMessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

export function useMessageList({ messages, isLoading }: UseMessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newMsgCount, setNewMsgCount] = useState(0);
  const prevLenRef = useRef(messages.length);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const atBot = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setIsAtBottom(atBot);
    if (atBot) setNewMsgCount(0);
  }, []);

  useEffect(() => {
    const newLen = messages.length;
    if (newLen > prevLenRef.current) {
      if (isAtBottom) {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      } else {
        setNewMsgCount((c) => c + (newLen - prevLenRef.current));
      }
    }
    prevLenRef.current = newLen;
  }, [messages.length, isAtBottom]);

  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'instant' });
    }
  }, [isLoading, messages.length]); // Fixed missing dependency warning

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setNewMsgCount(0);
  }, []);

  return {
    containerRef,
    bottomRef,
    isAtBottom,
    newMsgCount,
    handleScroll,
    scrollToBottom,
  };
}
