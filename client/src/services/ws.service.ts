/*
 * Copyright (c) 2026 Blurz
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { WS_URL } from '../lib/constants';

type MessageCallback = (data: Record<string, unknown>) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private messageCallbacks: MessageCallback[] = [];
  private reconnectInterval = 2000;
  private maxReconnectInterval = 30000;
  private currentReconnectInterval = 2000;
  private isIntentionalClose = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private currentToken: string | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  connect(token: string) {
    // Prevent duplicate connections in OPEN or CONNECTING state
    if (
      this.socket?.readyState === WebSocket.OPEN ||
      this.socket?.readyState === WebSocket.CONNECTING
    ) {
      return;
    }

    this.isIntentionalClose = false;
    this.currentToken = token;
    const url = `${WS_URL}?token=${token}`;

    try {
      this.socket = new WebSocket(url);
    } catch (err) {
      console.error('[WS] Failed to create WebSocket:', err);
      this.scheduleReconnect();
      return;
    }

    this.socket.onopen = () => {
      console.log('[WS] Connected');
      // Reset reconnect backoff on successful connection
      this.currentReconnectInterval = this.reconnectInterval;
      // Start keepalive pings every 25s to prevent server-side timeout (TTL=60s)
      this.startPing();
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Don't propagate pong/connected to application handlers
        if (data.type === 'pong' || data.type === 'connected') {
          if (data.type === 'connected') {
            console.log('[WS] Server confirmed connection, user_id:', data.user_id);
          }
          return;
        }
        this.messageCallbacks.forEach((cb) => cb(data));
      } catch (err) {
        console.error('[WS] Parse error', err);
      }
    };

    this.socket.onclose = (event) => {
      this.stopPing();
      if (!this.isIntentionalClose) {
        console.log(
          `[WS] Disconnected (code=${event.code}, reason=${event.reason}). ` +
          `Reconnecting in ${this.currentReconnectInterval}ms...`
        );
        this.scheduleReconnect();
      }
    };

    this.socket.onerror = (err) => {
      console.error('[WS] Error', err);
      // Don't close here — let onclose handle reconnection
    };
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (!this.currentToken || this.isIntentionalClose) return;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.currentToken) {
        this.connect(this.currentToken);
      }
    }, this.currentReconnectInterval);

    // Exponential backoff with cap
    this.currentReconnectInterval = Math.min(
      this.currentReconnectInterval * 1.5,
      this.maxReconnectInterval,
    );
  }

  private startPing() {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'ping' }));
      }
    }, 25000);
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  send(payload: Record<string, unknown>) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
    } else {
      console.warn('[WS] Cannot send: socket not open (state=%s)', this.socket?.readyState);
    }
  }

  disconnect() {
    this.isIntentionalClose = true;
    this.stopPing();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.currentToken = null;
  }

  onMessage(callback: MessageCallback): () => void {
    this.messageCallbacks.push(callback);
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter((cb) => cb !== callback);
    };
  }

  get isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

export const wsService = new WebSocketService();
