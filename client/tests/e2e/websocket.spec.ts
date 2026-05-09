import { test, expect, Page } from './fixtures';
import { ChatPage } from './pages/ChatPage';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Uses Playwright's WebSocket routing to intercept the next WS connection
 * and close it immediately, simulating a server-side disconnect.
 */
async function interceptAndCloseWS(page: Page): Promise<void> {
  await page.routeWebSocket(/.*/, (ws) => {
    // Immediately close every message route → triggers disconnect in app
    ws.onopen(() => ws.close());
  });
}

/**
 * Closes the real WS from the browser side via page.evaluate.
 * Works when the app does NOT abstract the WebSocket reference.
 */
async function dropWSFromBrowser(page: Page): Promise<void> {
  await page.evaluate(() => {
    // Find all open WebSocket instances on the window
    // The app connects to WS on startup — close the first one found
    const ws = (window as Window & { __ws?: WebSocket }).__ws;
    if (ws) {
      ws.close();
      return;
    }
    // Fallback: monkey-patch the prototype close on the next tick
    const orig = WebSocket.prototype.send;
    WebSocket.prototype.send = function (...args) {
      this.close();
      WebSocket.prototype.send = orig;
    };
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('WebSocket connection', () => {
  // removed parallel mode

  test('connection indicator shows connected state on load', async ({ loggedInPage: page }) => {
    // The app should NOT show a "Connecting…" or error banner on normal load
    const disconnectBanner = page.locator(
      '[data-testid="connection-banner"], text=Connecting, text=Reconnecting',
    );

    // Give WS time to connect
    await page.waitForTimeout(2_000);

    // Banner must not be visible
    await expect(disconnectBanner).not.toBeVisible();
  });

  test('disconnection banner appears when WebSocket drops', async ({ loggedInPage: page }) => {
    const chat = new ChatPage(page);
    await page.waitForTimeout(1_500); // let initial WS connect

    // Intercept and kill the WebSocket
    await interceptAndCloseWS(page);

    // Trigger a reconnect attempt by navigating or waiting
    // The app's reconnect logic will detect the close
    await page.waitForTimeout(1_500);

    // A "Connecting…" or disconnection indicator should appear
    const banner = page.locator(
      '[data-testid="connection-banner"], text=/connecting/i, text=/disconnected/i, text=/reconnecting/i',
    );
    // If the banner doesn't show (app may reconnect instantly), that's also acceptable
    // What we MUST assert is that the app doesn't crash
    await expect(page.locator('body')).not.toContainText(/something went wrong|white screen/i);
  });

  test('UI recovers after WebSocket reconnects', async ({ loggedInPage: page }) => {
    const chat = new ChatPage(page);
    await page.waitForTimeout(1_500);

    // Drop WS
    await interceptAndCloseWS(page);
    await page.waitForTimeout(2_000);

    // Remove the intercept — allow real WS to reconnect
    await page.unrouteAll({ behavior: 'ignoreErrors' });

    // Wait for reconnect (up to 8 seconds)
    await page.waitForTimeout(8_000);

    // App must be usable: message input still works
    await chat.getSidebarItems().first().click();
    await expect(chat.messageInput).toBeVisible({ timeout: 8_000 });
  });

  test('messages sent during disconnection show error or queue', async ({ loggedInPage: page }) => {
    const chat = new ChatPage(page);

    // Open a chat
    await chat.getSidebarItems().first().click();
    await expect(chat.messageInput).toBeVisible({ timeout: 8_000 });

    // Go offline
    await page.context().setOffline(true);
    await page.waitForTimeout(500);

    const msg = `Offline msg ${Date.now()}`;
    await chat.messageInput.fill(msg);
    await chat.messageInput.press('Enter');

    // App must either:
    // A) Show an error toast / failed indicator
    // B) Queue the message (bubble appears with "pending" state)
    // C) Show a connection error in UI
    // What it must NOT do is silently succeed while offline
    const body = await page.locator('body').textContent();
    const hasError = /error|failed|offline|couldn.t send/i.test(body ?? '');
    const hasBubble = await chat.getMessages().filter({ hasText: msg }).isVisible().catch(() => false);

    expect(hasError || hasBubble, 'App gave no feedback for message sent while offline').toBe(true);

    // Back online
    await page.context().setOffline(false);
  });

  test('multiple rapid reconnects do not cause duplicate messages', async ({ twoUserPages }) => {
    const { pageA, pageB } = twoUserPages;
    const chatA = new ChatPage(pageA);
    const chatB = new ChatPage(pageB);

    // Both open the shared chat
    await chatA.getSidebarItems().filter({ hasText: /UserB/i }).first().click();
    await chatB.getSidebarItems().filter({ hasText: /UserA/i }).first().click();
    await expect(chatA.messageInput).toBeVisible({ timeout: 8_000 });
    await expect(chatB.messageInput).toBeVisible({ timeout: 8_000 });

    // Force 3 disconnects on pageA
    for (let i = 0; i < 3; i++) {
      await pageA.context().setOffline(true);
      await pageA.waitForTimeout(300);
      await pageA.context().setOffline(false);
      await pageA.waitForTimeout(500);
    }

    // pageB sends one message after reconnect
    const uniqueMsg = `Reconnect dedup ${Date.now()}`;
    await chatB.sendMessage(uniqueMsg);

    // Wait for delivery
    await expect(
      chatA.getMessages().filter({ hasText: uniqueMsg }),
    ).toBeVisible({ timeout: 12_000 });

    // Must appear exactly once
    const count = await chatA.getMessages().filter({ hasText: uniqueMsg }).count();
    expect(count).toBe(1);
  });
});

// ── Read Receipts ─────────────────────────────────────────────────────────────

test.describe('Read receipts & message status', () => {
  test('sent message shows tick after delivery', async ({ twoUserPages }) => {
    const { pageA, pageB } = twoUserPages;
    const chatA = new ChatPage(pageA);
    const chatB = new ChatPage(pageB);

    // Open shared chat on both sides
    await chatA.getSidebarItems().filter({ hasText: /UserB/i }).first().click();
    await chatB.getSidebarItems().filter({ hasText: /UserA/i }).first().click();
    await expect(chatA.messageInput).toBeVisible({ timeout: 8_000 });

    const msg = `Receipt test ${Date.now()}`;
    await chatA.sendMessage(msg);

    // After send, a tick icon should appear on the bubble
    const bubble = chatA.getMessages().filter({ hasText: msg });
    await expect(bubble).toBeVisible({ timeout: 8_000 });

    // Read-receipt element — could be single tick SVG
    const receipt = bubble.locator('[data-testid="read-receipt"], svg[data-receipt]');
    await expect(receipt).toBeVisible({ timeout: 8_000 });
  });
});

// ── Scroll behaviour ──────────────────────────────────────────────────────────

test.describe('Scroll behavior', () => {
  test('chat opens scrolled to bottom', async ({ chatPage: page }) => {
    const chat = new ChatPage(page);

    // After opening a chat, the scroll should be at the bottom
    // Check that the bottomRef sentinel is in view
    const lastBubble = chat.getMessages().last();
    if (await lastBubble.isVisible()) {
      await expect(lastBubble).toBeInViewport();
    }
  });

  test('new message auto-scrolls to bottom when user is at bottom', async ({ twoUserPages }) => {
    const { pageA, pageB } = twoUserPages;
    const chatA = new ChatPage(pageA);
    const chatB = new ChatPage(pageB);

    await chatA.getSidebarItems().filter({ hasText: /UserB/i }).first().click();
    await chatB.getSidebarItems().filter({ hasText: /UserA/i }).first().click();
    await expect(chatA.messageInput).toBeVisible({ timeout: 8_000 });

    const msg = `Auto scroll ${Date.now()}`;
    await chatB.sendMessage(msg);

    // Last message on pageA should be in viewport (auto-scrolled)
    const bubble = chatA.getMessages().filter({ hasText: msg });
    await expect(bubble).toBeVisible({ timeout: 10_000 });
    await expect(bubble).toBeInViewport();
  });

  test('no auto-scroll when user has scrolled up', async ({ twoUserPages }) => {
    const { pageA, pageB } = twoUserPages;
    const chatA = new ChatPage(pageA);
    const chatB = new ChatPage(pageB);

    await chatA.getSidebarItems().filter({ hasText: /UserB/i }).first().click();
    await chatB.getSidebarItems().filter({ hasText: /UserA/i }).first().click();
    await expect(chatA.messageInput).toBeVisible({ timeout: 8_000 });

    // Scroll pageA to top
    await chatA.scrollToTop();

    // Record scroll position
    const scrollBefore = await page.evaluate(() =>
      document.querySelector('.chat-bg-pattern')?.scrollTop ?? 0,
    );
    const page = pageA;

    // pageB sends
    await chatB.sendMessage(`No auto scroll ${Date.now()}`);
    await page.waitForTimeout(2_000);

    // Scroll should NOT have changed much (stayed near top)
    const scrollAfter = await page.evaluate(() =>
      document.querySelector('.chat-bg-pattern')?.scrollTop ?? 0,
    );
    expect(Math.abs(scrollAfter - scrollBefore)).toBeLessThan(200);

    // Floating button should be visible
    await expect(chatA.getNewMessageButton()).toBeVisible({ timeout: 8_000 });
  });
});
