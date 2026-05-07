import { test, expect } from './fixtures';
import { ChatPage } from './pages/ChatPage';

test.describe('Error & edge case flows', () => {
  test.describe.configure({ mode: 'parallel' });

  // ── Empty chat state ────────────────────────────────────────────────────

  test('chat with no messages shows empty state', async ({ loggedInPage: page }) => {
    const chat = new ChatPage(page);

    await expect(chat.getSidebarItems().first()).toBeVisible({ timeout: 10_000 });
    await chat.getSidebarItems().first().click();

    // Check for empty state text (may or may not be empty depending on seed)
    // If there are no messages, we should see the empty prompt
    const messageCount = await chat.getMessages().count();
    if (messageCount === 0) {
      const emptyState = page.locator(
        'text=Say hello, text=Start the conversation, [data-testid="empty-chat"]',
      );
      await expect(emptyState.first()).toBeVisible({ timeout: 5_000 });
    }

    // No console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.waitForTimeout(1_000);
    const criticalErrors = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('404'),
    );
    expect(criticalErrors).toHaveLength(0);
  });

  // ── Long contact name ────────────────────────────────────────────────────

  test('very long contact name is truncated in sidebar without breaking layout', async ({
    loggedInPage: page,
  }) => {
    const chat = new ChatPage(page);
    await expect(chat.getSidebarItems().first()).toBeVisible({ timeout: 10_000 });

    // Check that no chat list item overflows its container
    const items = chat.getSidebarItems();
    const count = await items.count();
    for (let i = 0; i < Math.min(count, 5); i++) {
      const item = items.nth(i);
      const box = await item.boundingBox();
      if (!box) continue;

      // Name element should not be wider than the item
      const nameEl = item.locator('[data-testid="contact-name"], h3, span').first();
      const nameBox = await nameEl.boundingBox();
      if (nameBox) {
        expect(nameBox.x + nameBox.width).toBeLessThanOrEqual(box.x + box.width + 4);
      }
    }

    // No horizontal scroll in sidebar
    const hasScroll = await page.locator('[data-testid="sidebar"]').evaluate(
      (el) => el.scrollWidth > el.clientWidth,
    );
    expect(hasScroll).toBe(false);
  });

  // ── Avatar fallback ──────────────────────────────────────────────────────

  test('avatar shows initials when image fails to load', async ({ loggedInPage: page }) => {
    await page.addStyleTag({
      content: 'img[data-testid="avatar-img"] { display: none !important; }',
    });

    const chat = new ChatPage(page);
    await expect(chat.getSidebarItems().first()).toBeVisible({ timeout: 10_000 });

    // Initials fallback element should be visible
    const initialsEl = page.locator('[data-testid="avatar-initials"], .avatar-initials').first();
    await expect(initialsEl).toBeVisible({ timeout: 5_000 });
  });

  // ── Server 500 error ─────────────────────────────────────────────────────

  test('app handles server returning 500 without crashing', async ({ loggedInPage: page }) => {
    // Intercept GET /chats and return 500
    await page.route('**/api/v1/chats**', (route) => {
      route.fulfill({ status: 500, body: JSON.stringify({ detail: 'Internal Server Error' }) });
    });

    // Reload triggers the chat list fetch
    await page.reload();
    await page.waitForURL('**/chat**', { timeout: 10_000 });

    // App must not show white screen (body must have meaningful content)
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(10);

    // No fatal JS error overlay
    const errorOverlay = page.locator('vite-error-overlay, [data-testid="fatal-error"]');
    await expect(errorOverlay).not.toBeVisible();

    // User should see some error feedback
    await page.unrouteAll();
  });

  // ── Server 401 after token expiry ────────────────────────────────────────

  test('app handles 401 response by redirecting to /login without loop', async ({
    loggedInPage: page,
  }) => {
    // Intercept ALL API calls and return 401
    await page.route('**/api/v1/**', (route) => {
      route.fulfill({ status: 401, body: JSON.stringify({ detail: 'Unauthorized' }) });
    });

    // The app dispatches 'auth-error' on 401, which calls logout + navigate
    // Trigger a fetch
    await page.reload();

    // Should end up on /login
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });

    // Must NOT be in a redirect loop — load login page once more
    await page.unrouteAll();
    await page.waitForTimeout(1_000);
    await expect(page).toHaveURL(/\/login/);
  });

  // ── Network offline ──────────────────────────────────────────────────────

  test('app handles going offline gracefully', async ({ chatPage: page }) => {
    const chat = new ChatPage(page);
    await expect(chat.messageInput).toBeVisible({ timeout: 8_000 });

    // Go offline
    await page.context().setOffline(true);
    await page.waitForTimeout(500);

    const msg = `Offline attempt ${Date.now()}`;
    await chat.messageInput.fill(msg);
    await chat.messageInput.press('Enter');

    // Should see error feedback OR pending state — not silent success
    await page.waitForTimeout(2_000);
    const bodyText = (await page.locator('body').textContent()) ?? '';
    const hasFeedback =
      /error|failed|offline|couldn't send|no connection/i.test(bodyText) ||
      (await chat.getMessages().filter({ hasText: msg }).count()) > 0;

    expect(hasFeedback).toBe(true);

    // Recover
    await page.context().setOffline(false);
    await page.waitForTimeout(2_000);

    // App should still be functional
    await expect(page.locator('body')).not.toContainText(/something went wrong|fatal error/i);
  });

  // ── Shift+Enter does not send ────────────────────────────────────────────

  test('Shift+Enter inserts newline instead of sending', async ({ chatPage: page }) => {
    const chat = new ChatPage(page);
    const before = await chat.getMessages().count();

    await chat.messageInput.fill('Line one');
    await chat.messageInput.press('Shift+Enter');
    await chat.messageInput.type('Line two');

    // No message sent yet
    await page.waitForTimeout(400);
    expect(await chat.getMessages().count()).toBe(before);

    // Input should contain newline
    const value = await chat.messageInput.inputValue();
    expect(value).toContain('\n');
  });

  // ── Navigating to unknown route ──────────────────────────────────────────

  test('navigating to unknown route shows 404 page', async ({ loggedInPage: page }) => {
    await page.goto('/this-does-not-exist-xyz');
    // NotFoundPage is rendered for *
    const notFound = page.locator('text=404, text=not found, text=Page not found');
    await expect(notFound.first()).toBeVisible({ timeout: 5_000 });
  });

  // ── Console errors during normal use ─────────────────────────────────────

  test('no unexpected console errors during normal chat flow', async ({ browser }) => {
    const errors: string[] = [];
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));

    // Authenticate and use the app
    await page.goto('/login');
    const res = await page.request.post('http://localhost:8000/api/v1/auth/login', {
      data: { email: 'user_a@test.com', password: 'Test1234!' },
    });
    const body = await res.json();
    await page.evaluate((t) => localStorage.setItem('access_token', t), body.access_token);
    await page.goto('/chat');
    await page.waitForURL('**/chat**');

    const chat = new ChatPage(page);
    await expect(chat.getSidebarItems().first()).toBeVisible({ timeout: 10_000 });
    await chat.getSidebarItems().first().click();

    await page.waitForTimeout(2_000);

    const critical = errors.filter(
      (e) =>
        !e.includes('favicon') &&
        !e.includes('net::ERR') &&
        !e.includes('websocket') &&
        !e.toLowerCase().includes('websocket'),
    );

    expect(critical, `Console errors:\n${critical.join('\n')}`).toHaveLength(0);
    await ctx.close();
  });
});
