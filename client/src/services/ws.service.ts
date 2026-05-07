import { WS_URL } from '../lib/constants';

type MessageCallback = (data: Record<string, unknown>) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private messageCallbacks: MessageCallback[] = [];
  private reconnectInterval = 3000;
  private isIntentionalClose = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  connect(token: string) {
    if (this.socket?.readyState === WebSocket.OPEN) return;

    this.isIntentionalClose = false;
    const url = `${WS_URL}?token=${token}`;
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log('[WS] Connected');
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.messageCallbacks.forEach((cb) => cb(data));
      } catch (err) {
        console.error('[WS] Parse error', err);
      }
    };

    this.socket.onclose = () => {
      if (!this.isIntentionalClose) {
        console.log(`[WS] Disconnected. Reconnecting in ${this.reconnectInterval}ms...`);
        this.reconnectTimer = setTimeout(() => this.connect(token), this.reconnectInterval);
      }
    };

    this.socket.onerror = (err) => {
      console.error('[WS] Error', err);
    };
  }

  send(payload: Record<string, unknown>) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
    } else {
      console.error('[WS] Cannot send: socket not open');
    }
  }

  disconnect() {
    this.isIntentionalClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
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
