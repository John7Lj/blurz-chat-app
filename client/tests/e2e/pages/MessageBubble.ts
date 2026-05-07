import { Locator } from '@playwright/test';

/**
 * MessageBubble — wraps a single [data-testid="message-bubble"] locator.
 */
export class MessageBubble {
  constructor(private readonly locator: Locator) {}

  /** Raw text content of the bubble. */
  async getText(): Promise<string> {
    return (await this.locator.locator('[data-testid="bubble-text"]').textContent()) ?? '';
  }

  /** Timestamp text shown below the bubble. */
  async getTimestamp(): Promise<string> {
    return (
      (await this.locator.locator('[data-testid="bubble-timestamp"]').textContent()) ?? ''
    );
  }

  /**
   * Read-receipt status: 'single' | 'double' | 'blue' | 'none'
   * Based on data-receipt attribute set by MessageBubble component.
   */
  async getReadReceipt(): Promise<string> {
    const el = this.locator.locator('[data-testid="read-receipt"]');
    try {
      return (await el.getAttribute('data-receipt')) ?? 'none';
    } catch {
      return 'none';
    }
  }

  /** True if this bubble was sent by the current user (right-aligned). */
  async isSent(): Promise<boolean> {
    return (await this.locator.getAttribute('data-mine')) === 'true';
  }

  /** True if this bubble was received from another user (left-aligned). */
  async isReceived(): Promise<boolean> {
    return (await this.locator.getAttribute('data-mine')) === 'false';
  }
}
