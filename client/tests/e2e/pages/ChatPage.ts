import { Page, Locator, expect } from '@playwright/test';

export class ChatPage {
  readonly page: Page;

  // Sidebar
  readonly sidebar: Locator;
  readonly searchInput: Locator;
  readonly chatListItems: Locator;
  readonly noChatsMessage: Locator;

  // Chat window
  readonly messageInput: Locator;
  readonly sendButton: Locator;
  readonly micButton: Locator;
  readonly messageBubbles: Locator;
  readonly newMessageButton: Locator;
  readonly backButton: Locator;

  // Connection
  readonly connectionBanner: Locator;

  constructor(page: Page) {
    this.page = page;

    // Sidebar
    this.sidebar       = page.locator('[data-testid="sidebar"]');
    this.searchInput   = page.locator('input[aria-label="Search or start new chat"]');
    this.chatListItems = page.locator('[data-testid="chat-list-item"]');
    this.noChatsMessage = page.locator('text=No chats found');

    // Chat window
    this.messageInput     = page.locator('textarea[placeholder="Type a message"]');
    this.sendButton       = page.locator('button[aria-label="Send message"]');
    this.micButton        = page.locator('button[aria-label="Voice message"]');
    this.messageBubbles   = page.locator('[data-testid="message-bubble"]');
    this.newMessageButton = page.locator('button', { hasText: /new message/i });
    this.backButton       = page.locator('button[aria-label="Go back"]');

    // Connectivity
    this.connectionBanner = page.locator('[data-testid="connection-banner"], text=Connecting');
  }

  /** Returns all sidebar chat list items. */
  getSidebarItems(): Locator {
    return this.chatListItems;
  }

  /** Click the chat list item whose text contains `contactName`. */
  async selectChat(contactName: string) {
    await this.chatListItems
      .filter({ hasText: contactName })
      .first()
      .click();
  }

  getSearchInput(): Locator {
    return this.searchInput;
  }

  async search(query: string) {
    await this.searchInput.fill(query);
  }

  /** Returns the unread badge locator for a given contact name. */
  getUnreadBadge(contactName: string): Locator {
    return this.chatListItems
      .filter({ hasText: contactName })
      .locator('[data-testid="unread-badge"]');
  }

  /** Type and send a message via the textarea. */
  async sendMessage(text: string) {
    await this.messageInput.fill(text);
    await this.messageInput.press('Enter');
  }

  /** Returns all message bubble locators. */
  getMessages(): Locator {
    return this.messageBubbles;
  }

  /** Returns the last message bubble. */
  getLastMessage(): Locator {
    return this.messageBubbles.last();
  }

  getConnectionStatus(): Locator {
    return this.connectionBanner;
  }

  async scrollToTop() {
    const container = this.page.locator('[data-testid="message-list"], .chat-bg-pattern').first();
    await container.evaluate((el) => {
      el.scrollTop = 0;
    });
    await this.page.waitForTimeout(300);
  }

  getNewMessageButton(): Locator {
    return this.newMessageButton;
  }

  async clickNewMessageButton() {
    await this.newMessageButton.click();
  }
}
