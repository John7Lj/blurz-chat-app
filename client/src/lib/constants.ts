/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// ── Environment URLs ────────────────────────────────────────────────
/** Base URL for the REST API. */
export const API_URL = import.meta.env.VITE_API_URL as string;
/** WebSocket endpoint URL. */
export const WS_URL = import.meta.env.VITE_WS_URL as string;
/** Base URL for user-uploaded media (profile pictures, etc.). */
export const MEDIA_URL = import.meta.env.VITE_MEDIA_URL as string;

// ── Validation ──────────────────────────────────────────────────────
/** Minimum password length required during registration and reset. */
export const MIN_PASSWORD_LENGTH = 8;
/** Maximum password length accepted by bcrypt. */
export const MAX_PASSWORD_LENGTH = 72;
/** Maximum username length. */
export const MAX_USERNAME_LENGTH = 20;
/** Maximum first/last name length. */
export const MAX_NAME_LENGTH = 50;
/** Minimum characters required before a search query is sent. */
export const MIN_SEARCH_QUERY_LENGTH = 2;
/** Minimum password length for the login form (less strict than signup). */
export const MIN_LOGIN_PASSWORD_LENGTH = 6;

// ── File Upload ─────────────────────────────────────────────────────
/** Maximum file size for profile picture uploads (5 MB). */
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
/** MIME types accepted for profile picture uploads. */
export const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

// ── Real-Time / WebSocket ───────────────────────────────────────────
/** Interval between WebSocket keep-alive pings (ms). */
export const WS_PING_INTERVAL_MS = 25_000;
/** Initial reconnect delay after a WebSocket disconnect (ms). */
export const WS_RECONNECT_INTERVAL_MS = 2_000;
/** Maximum reconnect delay with exponential back-off (ms). */
export const WS_MAX_RECONNECT_INTERVAL_MS = 30_000;
/** Debounce window for outgoing typing indicators (ms). */
export const TYPING_DEBOUNCE_MS = 1_000;
/** Auto-clear delay for incoming typing indicators (ms). */
export const TYPING_TIMEOUT_MS = 3_000;

// ── Chat / Messages ─────────────────────────────────────────────────
/** Max time gap between consecutive messages to keep them in the same group (ms). */
export const MESSAGE_GROUP_INTERVAL_MS = 5 * 60 * 1_000;
/** Pixel threshold from bottom of scroll container to consider "at bottom". */
export const SCROLL_BOTTOM_THRESHOLD = 80;
/** IntersectionObserver threshold for marking a message as read. */
export const MESSAGE_OBSERVER_THRESHOLD = 0.8;
/** Number of skeleton placeholders shown while a chat list loads. */
export const CHAT_LIST_SKELETON_COUNT = 7;
/** Number of skeleton placeholders shown while messages load. */
export const MESSAGE_SKELETON_COUNT = 6;
/** Number of skeleton placeholders shown while contacts load. */
export const CONTACT_SKELETON_COUNT = 5;

// ── API Defaults ────────────────────────────────────────────────────
/** Default number of messages fetched per page. */
export const DEFAULT_MESSAGE_LIMIT = 50;
/** HTTP request timeout (ms). */
export const API_TIMEOUT_MS = 15_000;
/** React Query stale time for user profile data (ms). */
export const USER_STALE_TIME_MS = 60_000;
/** React Query default stale time (ms). */
export const DEFAULT_STALE_TIME_MS = 30_000;

// ── Toast ───────────────────────────────────────────────────────────
/** Default toast notification duration (ms). */
export const TOAST_DURATION_MS = 4_000;
