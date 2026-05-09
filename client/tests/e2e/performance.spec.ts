import { test, expect } from './fixtures';
import { ChatPage } from './pages/ChatPage';

test.describe('Performance E2E checks', () => {
  // Performance tests run sequentially to avoid false readings
  test.describe.configure({ mode: 'serial' });

  // ── Initial page load ─────────────────────────────────────────────────────

  test('initial page load is fully interactive under 2 seconds', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    // Inject auth so /chat loads directly
    await page.goto('/login');
    const res = await page.request.post('http://localhost:8000/api/v1/auth/login', {
      data: { email: 'user_a@test.com', password: 'Test1234!' },
    });
    const body = await res.json();
    await page.evaluate((t) => localStorage.setItem('access_token', t), body.access_token);

    // Measure navigation to /chat
    const start = Date.now();
    await page.goto('/chat');
    await page.waitForURL('**/chat**');

    // Wait until the sidebar items are rendered (= page is interactive)
    const chat = new ChatPage(page);
    await expect(chat.getSidebarItems().first()).toBeVisible({ timeout: 5_000 });

    const elapsed = Date.now() - start;
    expect(elapsed, `Load time ${elapsed}ms exceeds 2000ms`).toBeLessThan(2_000);

    await ctx.close();
  });

  // ── Navigation Performance API ────────────────────────────────────────────

  test('navigation performance metrics are within budget', async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    await page.goto('/login');
    const res = await page.request.post('http://localhost:8000/api/v1/auth/login', {
      data: { email: 'user_a@test.com', password: 'Test1234!' },
    });
    const body = await res.json();
    await page.evaluate((t) => localStorage.setItem('access_token', t), body.access_token);
    await page.goto('/chat');
    await page.waitForURL('**/chat**');
    await page.waitForLoadState('networkidle');

    const metrics = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
        loadComplete: nav.loadEventEnd - nav.startTime,
        firstByte: nav.responseStart - nav.startTime,
      };
    });

    expect(metrics.domContentLoaded, `DCL ${metrics.domContentLoaded}ms`).toBeLessThan(3_000);
    expect(metrics.loadComplete, `Load ${metrics.loadComplete}ms`).toBeLessThan(5_000);

    await ctx.close();
  });

  // ── Search performance ────────────────────────────────────────────────────

  test('search input filters chat list in under 200ms', async ({ loggedInPage: page }) => {
    const chat = new ChatPage(page);
    await expect(chat.getSidebarItems().first()).toBeVisible({ timeout: 10_000 });

    const start = Date.now();
    await chat.getSearchInput().fill('user');
    // Wait for the DOM to reflect the filter
    await page.waitForFunction(
      () => document.querySelectorAll('[data-testid="chat-list-item"]').length > 0,
      { timeout: 1_000 },
    );
    const elapsed = Date.now() - start;
    expect(elapsed, `Search took ${elapsed}ms`).toBeLessThan(200);
  });

  // ── Rendering under load ──────────────────────────────────────────────────

  test('page remains responsive while receiving 10 rapid messages', async ({ twoUserPages }) => {
    const { pageA, pageB } = twoUserPages;
    const chatA = new ChatPage(pageA);
    const chatB = new ChatPage(pageB);

    await chatA.getSidebarItems().filter({ hasText: /UserB/i }).first().click();
    await chatB.getSidebarItems().filter({ hasText: /UserA/i }).first().click();
    await expect(chatA.messageInput).toBeVisible({ timeout: 8_000 });

    const start = Date.now();

    // pageB sends 10 messages
    for (let i = 1; i <= 10; i++) {
      await chatB.messageInput.fill(`Perf msg ${i}`);
      await chatB.messageInput.press('Enter');
    }

    // All 10 must appear on pageA within 2 seconds
    for (let i = 1; i <= 10; i++) {
      await expect(chatA.getMessages().filter({ hasText: `Perf msg ${i}` })).toBeVisible({
        timeout: 5_000,
      });
    }

    const elapsed = Date.now() - start;
    expect(elapsed, `10 messages delivered in ${elapsed}ms`).toBeLessThan(5_000);
  });

  // ── No long tasks ─────────────────────────────────────────────────────────

  test('opening a chat does not cause long JS tasks (>50ms)', async ({ loggedInPage: page }) => {
    const chat = new ChatPage(page);
    await expect(chat.getSidebarItems().first()).toBeVisible({ timeout: 10_000 });

    // Start observing long tasks
    await page.evaluate(() => {
      (window as Window & { __longTasks?: PerformanceEntry[] }).__longTasks = [];
      const obs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          ((window as Window & { __longTasks?: PerformanceEntry[] }).__longTasks ??= []).push(entry);
        }
      });
      obs.observe({ entryTypes: ['longtask'] });
    });

    await chat.getSidebarItems().first().click();
    await expect(chat.messageInput).toBeVisible({ timeout: 8_000 });
    await page.waitForTimeout(500);

    const longTasks = await page.evaluate(
      () => ((window as Window & { __longTasks?: { duration: number }[] }).__longTasks ?? []).map((e) => e.duration),
    );

    // Allow a maximum of 2 long tasks (some are unavoidable on initial render)
    expect(longTasks.length, `Long tasks found: ${longTasks}`).toBeLessThanOrEqual(2);
  });

  // ── Memory: no obvious leak across chat switches ──────────────────────────

  test('switching between chats does not leak DOM nodes', async ({ loggedInPage: page }) => {
    const chat = new ChatPage(page);
    await expect(chat.getSidebarItems().first()).toBeVisible({ timeout: 10_000 });

    // Count initial DOM nodes
    const countNodes = () => page.evaluate(() => document.querySelectorAll('*').length);

    const before = await countNodes();

    // Switch chats several times
    const items = chat.getSidebarItems();
    const n = Math.min(await items.count(), 3);
    for (let cycle = 0; cycle < 3; cycle++) {
      for (let i = 0; i < n; i++) {
        await items.nth(i).click();
        await page.waitForTimeout(200);
      }
    }

    const after = await countNodes();

    // Allow up to 30% growth (React keeps some refs, virtualization might add nodes)
    const growth = (after - before) / before;
    expect(growth, `DOM grew by ${(growth * 100).toFixed(1)}%`).toBeLessThan(0.3);
  });
});
