import { vi } from 'vitest';

type MessageCallback = (data: Record<string, unknown>) => void;

/**
 * Mock WebSocket service that replaces ws.service.ts for testing.
 * Provides methods to simulate server-side events.
 */
export class MockWebSocketService {
  private callbacks: MessageCallback[] = [];
  private _isConnected = false;
  public connectCalls: string[] = [];
  public sentMessages: Record<string, unknown>[] = [];

  connect = vi.fn((token: string) => {
    this.connectCalls.push(token);
    this._isConnected = true;
  });

  disconnect = vi.fn(() => {
    this._isConnected = false;
  });

  send = vi.fn((payload: Record<string, unknown>) => {
    if (this._isConnected) {
      this.sentMessages.push(payload);
    }
  });

  onMessage = vi.fn((callback: MessageCallback): (() => void) => {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter((cb) => cb !== callback);
    };
  });

  get isConnected(): boolean {
    return this._isConnected;
  }

  // ── Test Helpers ────────────────────────────────────────────────
  /** Simulate a message arriving from the server */
  simulateMessage(data: Record<string, unknown>) {
    this.callbacks.forEach((cb) => cb(data));
  }

  /** Simulate server disconnect */
  simulateDisconnect() {
    this._isConnected = false;
  }

  /** Simulate reconnection */
  simulateReconnect() {
    this._isConnected = true;
  }

  /** Reset all state for a clean test */
  reset() {
    this.callbacks = [];
    this._isConnected = false;
    this.connectCalls = [];
    this.sentMessages = [];
    this.connect.mockClear();
    this.disconnect.mockClear();
    this.send.mockClear();
    this.onMessage.mockClear();
  }
}

/** Singleton mock instance used across tests */
export const mockWsService = new MockWebSocketService();

/**
 * Call this in beforeEach() to mock the ws.service module.
 * Usage:
 *   vi.mock('../../services/ws.service', () => mockWsServiceModule());
 */
export function mockWsServiceModule() {
  return {
    wsService: mockWsService,
  };
}
