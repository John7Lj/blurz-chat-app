import { test as base, expect, Page, BrowserContext } from '@playwright/test';

// ── Constants ────────────────────────────────────────────────────────────────
export const BASE_URL = 'http://localhost:5173';
export const API_URL  = 'http://localhost:8000/api/v1';

export const USER_A = { email: 'user_a@test.com', password: 'Test1234!', name: 'UserA Test' };
export const USER_B = { email: 'user_b@test.com', password: 'Test1234!', name: 'UserB Test' };
export const USER_C = { email: 'user_c@test.com', password: 'Test1234!', name: 'UserC Test' };

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Authenticate a page as the given user by calling the login API and injecting
 * the JWT into localStorage directly (avoids UI flow in fixture setup).
 */
export async function authenticatePage(
  page: Page,
  user: { email: string; password: string },
) {
  // 1. Go to base URL first so we can manipulate localStorage
  await page.goto('/login');

  // 2. Hit the API directly for a token
  const res = await page.request.post(`${API_URL}/auth/login`, {
    data: { email: user.email, password: user.password },
  });
  expect(res.ok(), `Login failed for ${user.email}: ${res.status()}`).toBeTruthy();
  const body = await res.json();
  const token: string = body.access_token;
  const userId: string = body.user?.id ?? body.id ?? '';

  // 3. Inject into localStorage so the Zustand auth store picks it up
  await page.evaluate(
    ({ token, userId }) => {
      localStorage.setItem('access_token', token);
      if (userId) localStorage.setItem('user_id', userId);
      
      localStorage.setItem('blurz-auth', JSON.stringify({
        state: {
          token,
          userId,
          isAuthenticated: true,
        },
        version: 0,
      }));
    },
    { token, userId },
  );

  // 4. Navigate to the app — ProtectedRoute will now pass
  await page.goto('/chat');
  await page.waitForURL('**/chat**');
  return token;
}

// ── Fixture types ────────────────────────────────────────────────────────────
type Fixtures = {
  loggedInPage: Page;
  twoUserPages: { pageA: Page; pageB: Page; ctxA: BrowserContext; ctxB: BrowserContext };
  chatPage: Page;
  mobilePage: Page;
};

// ── Extended test object ─────────────────────────────────────────────────────
export const test = base.extend<Fixtures>({
  /**
   * loggedInPage — A fresh page already authenticated as user_a.
   */
  loggedInPage: async ({ browser }, use) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await authenticatePage(page, USER_A);
    await use(page);
    await ctx.close();
  },

  /**
   * twoUserPages — Two isolated browser contexts: pageA (user_a) and pageB (user_b).
   */
  twoUserPages: async ({ browser }, use) => {
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();
    await Promise.all([
      authenticatePage(pageA, USER_A),
      authenticatePage(pageB, USER_B),
    ]);
    await use({ pageA, pageB, ctxA, ctxB });
    await Promise.all([ctxA.close(), ctxB.close()]);
  },

  /**
   * chatPage — Logged in as user_a with the first chat already open.
   */
  chatPage: async ({ browser }, use) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await authenticatePage(page, USER_A);
    // Click the first chat item in the sidebar
    const firstChat = page.locator('[data-testid="chat-list-item"]').first();
    await firstChat.waitFor({ state: 'visible', timeout: 10_000 });
    await firstChat.click();
    await use(page);
    await ctx.close();
  },

  /**
   * mobilePage — Logged in as user_a with a 390×844 mobile viewport.
   */
  mobilePage: async ({ browser }, use) => {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
    });
    const page = await ctx.newPage();
    await authenticatePage(page, USER_A);
    await use(page);
    await ctx.close();
  },
});

export { expect };
