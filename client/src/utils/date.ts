/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { MESSAGE_GROUP_INTERVAL_MS } from '../lib/constants';

/**
 * Formats a date string into a relative time label (e.g. "Today", "Yesterday", "Mon, 5 May").
 * Used for date dividers in the message list.
 */
export function getDateLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isToday(d)) return 'Today';
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'EEE, d MMM');
  } catch {
    return '';
  }
}

/**
 * Checks whether two ISO date strings fall on the same calendar day.
 */
export function isSameDay(a: string, b: string): boolean {
  try {
    const da = new Date(a);
    const db = new Date(b);
    return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
  } catch {
    return false;
  }
}

/**
 * Determines whether two messages belong to the same visual group.
 * Messages are grouped if they share the same sender and are within
 * {@link MESSAGE_GROUP_INTERVAL_MS} of each other.
 */
export function inSameGroup(a: { sender_id: string; sent_at: string }, b: { sender_id: string; sent_at: string }): boolean {
  if (a.sender_id !== b.sender_id) return false;
  try {
    const diff = Math.abs(new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime());
    return diff <= MESSAGE_GROUP_INTERVAL_MS;
  } catch {
    return false;
  }
}

/**
 * Formats a date string into a compact relative time string (e.g. "2h", "3d").
 * Used for chat list item timestamps.
 */
export function formatRelativeTime(dateStr: string): string {
  try {
    const t = formatDistanceToNow(new Date(dateStr), { addSuffix: false });
    return t
      .replace('about ', '')
      .replace(' hours', 'h').replace(' hour', 'h')
      .replace(' minutes', 'm').replace(' minute', 'm')
      .replace(' days', 'd').replace(' day', 'd');
  } catch {
    return '';
  }
}

/**
 * Formats a date string into a localized HH:MM time string.
 * Used for message bubble timestamps.
 */
export function formatMessageTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}
