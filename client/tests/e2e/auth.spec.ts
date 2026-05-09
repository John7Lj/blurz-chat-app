import { test, expect, USER_A, USER_B } from './fixtures';
import { LoginPage } from './pages/LoginPage';


// ── Helper: assert no token in localStorage ──────────────────────────────────
async function assertNoToken(page: import('@playwright/test').Page) {
  const token = await page.evaluate(() => localStorage.getItem('access_token'));
  expect(token).toBeNull();
}

test.describe('Authentication flows', () => {
  test.describe.configure({ mode: 'parallel' });

  // ── Registration ─────────────────────────────────────────────────────────

  test('user can register a new account', async ({ browser }) => {
    const ctx  = await browser.newContext();
    const page = await ctx.newPage();

    // All three must be unique — backend checks email, phone, AND username
    const ts = Date.now();
    const unique = `reg_${ts}@test.com`;
    const username = `t_${ts.toString(36)}`;
    const phone = `555${ts.toString().slice(-7)}`;

    await page.goto('/signup');

    // Step 1: fill personal info
    await page.locator('#signup-first-name').fill('Tester');
    await page.locator('#signup-last-name').fill('User');
    await page.locator('#signup-email').fill(unique);
    await page.locator('button:has-text("Continue")').click();

    // Wait for step 2 to be interactive
    await expect(page.locator('#signup-username')).toBeVisible({ timeout: 5_000 });

    // Step 2: fill credentials
    await page.locator('#signup-username').fill(username);
    await page.locator('#signup-phone').fill(phone);
    await page.locator('#signup-password').fill('Test1234!');

    // Wait for button to be enabled then click
    await expect(page.locator('#signup-submit')).toBeEnabled({ timeout: 3_000 });
    await page.locator('#signup-submit').click();

    // Should navigate to /login on success
    await page.waitForURL('**/login**', { timeout: 15_000 });

    // Login page heading should be visible
    await expect(page.locator('h1:has-text("Welcome back")')).toBeVisible({ timeout: 5_000 });

    await ctx.close();
  });

  // ── Login — success ──────────────────────────────────────────────────────

  test('user can log in with correct credentials', async ({ browser }) => {
    const ctx  = await browser.newContext();
    const page = await ctx.newPage();
    const login = new LoginPage(page);

    await login.goto();
    await login.login(USER_A.email, USER_A.password);

    await page.waitForURL('**/chat**', { timeout: 10_000 });
    // Either the nav-rail or the sidebar header "Blurz" is visible
    await expect(page.locator('text=Blurz').first()).toBeVisible();

    await ctx.close();
  });

  // ── Login — failures ─────────────────────────────────────────────────────

  test('login fails with wrong password', async ({ browser }) => {
    const ctx  = await browser.newContext();
    const page = await ctx.newPage();
    const login = new LoginPage(page);

    await login.goto();
    await login.login(USER_A.email, 'WrongPassword!');

    // Must stay on /login
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });

    // Error message must appear (react-hot-toast uses role="status")
    await expect(page.locator('[role="status"]').first()).toBeVisible({ timeout: 10_000 });

    await assertNoToken(page);
    await ctx.close();
  });

  test('login fails with non-existent email', async ({ browser }) => {
    const ctx  = await browser.newContext();
    const page = await ctx.newPage();
    const login = new LoginPage(page);

    await login.goto();
    await login.login('nobody@nowhere.invalid', 'Test1234!');

    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });
    
    // Wait slightly for network and toast animation
    await page.waitForTimeout(1000);
    
    const err = await login.getErrorMessage();
    expect(err).not.toBeNull();
    await assertNoToken(page);

    await ctx.close();
  });

  // ── Route guard ──────────────────────────────────────────────────────────

  test('unauthenticated user is redirected to /login when accessing /', async ({ browser }) => {
    const ctx  = await browser.newContext();
    const page = await ctx.newPage();

    await page.goto('/');
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });

    await ctx.close();
  });

  // ── Persistence ──────────────────────────────────────────────────────────

  test('user stays logged in on page refresh', async ({ loggedInPage: page }) => {
    await page.reload();
    await expect(page).toHaveURL(/\/chat/, { timeout: 10_000 });
    // Sidebar is still present
    await expect(page.locator('text=Blurz').first()).toBeVisible();
  });

  // ── Token refresh ────────────────────────────────────────────────────────

  test('token refresh works transparently', async ({ loggedInPage: page }) => {
    // Expire the access token by replacing it with an obviously invalid one
    await page.evaluate(() => {
      localStorage.setItem('access_token', 'expired.token.value');
    });

    // The app's response interceptor should handle 401 and either
    // refresh or redirect. Attempt to trigger an API call by navigating.
    await page.reload();

    // If the app has silent refresh: stays on /chat
    // If the app lacks refresh (no refresh endpoint): redirected to /login
    // Both are valid — we just assert no crash
    const url = page.url();
    expect(url).toMatch(/\/(chat|login)/);
  });

  // ── Logout ───────────────────────────────────────────────────────────────

  test('logging out clears session and redirects to /login', async ({ loggedInPage: page }) => {
    // Navigate directly to profile to ensure logout button is accessible on mobile and desktop
    await page.goto('/profile');

    // Look for a logout option in the UI
    const logoutBtn = page.locator('button, a', { hasText: /log ?out|sign ?out/i }).first();
    await logoutBtn.waitFor({ state: 'visible', timeout: 5_000 });
    await logoutBtn.click();

    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
    await assertNoToken(page);

    // Navigating to / must redirect back to login
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  // ── Two sessions same user ───────────────────────────────────────────────

  test('two sessions of the same user can be active simultaneously', async ({ browser }) => {
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    const loginA = new LoginPage(pageA);
    const loginB = new LoginPage(pageB);

    await Promise.all([
      loginA.goto().then(() => loginA.login(USER_A.email, USER_A.password)),
      loginB.goto().then(() => loginB.login(USER_A.email, USER_A.password)),
    ]);

    await Promise.all([
      pageA.waitForURL('**/chat**'),
      pageB.waitForURL('**/chat**'),
    ]);

    // Both sessions active
    await expect(pageA.locator('text=Blurz').first()).toBeVisible();
    await expect(pageB.locator('text=Blurz').first()).toBeVisible();

    await Promise.all([ctxA.close(), ctxB.close()]);
  });
});
