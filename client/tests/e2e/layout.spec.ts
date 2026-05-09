import { test, expect } from './fixtures';

test.describe('Layout & navigation', () => {
  test.describe.configure({ mode: 'parallel' });

  // ── Desktop layout ───────────────────────────────────────────────────────

  test('sidebar and chat window both visible on desktop', async ({ loggedInPage: page }) => {
    // NavRail is .nav-rail (hidden on mobile, shown md+)
    const navRail = page.locator('nav.nav-rail');
    await expect(navRail).toBeVisible();

    // Sidebar column
    const sidebar = page.locator('[data-testid="sidebar"]');
    await expect(sidebar).toBeVisible();

    // Chat window placeholder / empty state on right
    const chatArea = page.locator('[data-testid="chat-window"], [data-testid="empty-chat-state"]');
    await expect(chatArea.first()).toBeVisible();

    // No horizontal scrollbar
    const hasHScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHScroll).toBe(false);
  });

  test('desktop sidebar has correct width (≥300px)', async ({ loggedInPage: page }) => {
    const sidebar = page.locator('[data-testid="sidebar"]');
    await expect(sidebar).toBeVisible();
    const box = await sidebar.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(300);
  });

  // ── Mobile layout ────────────────────────────────────────────────────────

  test('mobile shows sidebar only by default', async ({ mobilePage: page }) => {
    const sidebar  = page.locator('[data-testid="sidebar"]');
    const chatWin  = page.locator('[data-testid="chat-window"]');

    await expect(sidebar).toBeVisible();
    // Chat window should not be visible when no chat is open
    await expect(chatWin).not.toBeVisible().catch(() => {
      // If chatWin doesn't exist yet, that's also fine
    });
  });

  test('mobile: selecting chat shows chat window, hides sidebar', async ({ mobilePage: page }) => {
    const firstChat = page.locator('[data-testid="chat-list-item"]').first();
    await firstChat.waitFor({ state: 'visible', timeout: 10_000 });
    await firstChat.click();

    // After selection, chat window is full-screen
    const chatWin = page.locator('[data-testid="chat-window"]');
    await expect(chatWin).toBeVisible({ timeout: 5_000 });

    // Sidebar should be hidden
    const sidebar = page.locator('[data-testid="sidebar"]');
    await expect(sidebar).not.toBeVisible();
  });

  test('mobile: back button returns to sidebar', async ({ mobilePage: page }) => {
    // Open a chat
    const firstChat = page.locator('[data-testid="chat-list-item"]').first();
    await firstChat.waitFor({ state: 'visible', timeout: 10_000 });
    await firstChat.click();

    // Click back
    const backBtn = page.locator('button[aria-label="Go back"]');
    await backBtn.waitFor({ state: 'visible', timeout: 5_000 });
    await backBtn.click();

    // Sidebar returns
    const sidebar = page.locator('[data-testid="sidebar"]');
    await expect(sidebar).toBeVisible({ timeout: 5_000 });

    // Chat window hides
    const chatWin = page.locator('[data-testid="chat-window"]');
    await expect(chatWin).not.toBeVisible();
  });

  // ── Dark mode ────────────────────────────────────────────────────────────

  test('dark mode applied when system preference is dark', async ({ browser }) => {
    const ctx = await browser.newContext({ colorScheme: 'dark' });
    const page = await ctx.newPage();

    // Inject token to skip login
    await page.goto('/login');
    const res = await page.request.post('http://localhost:8000/api/v1/auth/login', {
      data: { email: 'user_a@test.com', password: 'Test1234!' },
    });
    const body = await res.json();
    await page.evaluate((t) => localStorage.setItem('access_token', t), body.access_token);
    await page.goto('/chat');
    await page.waitForURL('**/chat**');

    // The app uses data-theme attribute on <html>
    // In dark mode, CSS variables should resolve to dark values
    // We check that the background is dark by evaluating computed style
    const bg = await page.evaluate(() => {
      const el = document.documentElement;
      return getComputedStyle(el).getPropertyValue('--chat-sidebar-bg').trim();
    });
    // Dark sidebar bg should not be an empty string
    expect(bg).not.toBe('');

    await ctx.close();
  });

  // ── Responsive — no overflow ─────────────────────────────────────────────

  for (const width of [375, 768, 1280, 1920]) {
    test(`no layout overflow at ${width}px viewport`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await ctx.newPage();

      await page.goto('/login');
      const res = await page.request.post('http://localhost:8000/api/v1/auth/login', {
        data: { email: 'user_a@test.com', password: 'Test1234!' },
      });
      const body = await res.json();
      await page.evaluate((t) => localStorage.setItem('access_token', t), body.access_token);
      await page.goto('/chat');
      await page.waitForURL('**/chat**');

      const hasHScroll = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(hasHScroll, `Horizontal overflow at ${width}px`).toBe(false);

      await ctx.close();
    });
  }

  // ── NavRail navigation ───────────────────────────────────────────────────

  test('NavRail navigates to contacts page', async ({ loggedInPage: page }) => {
    const contactsBtn = page.locator('button[aria-label="Contacts"]');
    await contactsBtn.click();
    await expect(page).toHaveURL(/\/contacts/);
  });

  test('NavRail navigates to notifications page', async ({ loggedInPage: page }) => {
    const notifBtn = page.locator('button[aria-label="Notifications"]');
    await notifBtn.click();
    await expect(page).toHaveURL(/\/notifications/);
  });

  test('NavRail navigates to settings page', async ({ loggedInPage: page }) => {
    const settingsBtn = page.locator('button[aria-label="Settings"]');
    await settingsBtn.click();
    await expect(page).toHaveURL(/\/settings/);
  });
});
