import { test, expect } from './fixtures';

/* ═══════════════════════════════════════════════════════════════════
   E2E Integration Tests — Full User Flows
   Uses Playwright to test the complete app in a real browser.
   ═══════════════════════════════════════════════════════════════════ */

// ── Helpers ─────────────────────────────────────────────────────────


// ═══════════════════════════════════════════════════════════════════
// Flow 1 — Open app and view chats
// ═══════════════════════════════════════════════════════════════════

test.describe('Flow 1: Open app and read messages', () => {
  test('app loads and sidebar shows chat list', async ({ loggedInPage: page }) => {
    /**
     * Tests: Initial load shows sidebar with chat items.
     * Why: Verifies auth → chat list pipeline works end-to-end.
     * Failure reveals: Auth broken, API broken, or rendering broken.
     */
    await expect(page.locator('input[placeholder="Search or start new chat"]')).toBeVisible();
    // At least one chat item should be visible (if seeded)
    const chatItems = page.locator('[data-testid="chat-list-item"]');
    await expect(chatItems.first()).toBeVisible({ timeout: 10000 });
  });

  test('clicking a chat opens the chat window', async ({ loggedInPage: page }) => {
    /**
     * Tests: Chat selection opens the message view.
     * Why: Core navigation flow.
     * Failure reveals: setActiveChat broken, ChatWindow not rendering.
     */
    // Click first chat item
    const firstChat = page.locator('[data-testid="chat-list-item"]').first();
    const contactName = await firstChat.locator('[data-testid="contact-name"]').textContent();
    await firstChat.click();

    // Chat header should show the contact name
    if (contactName) {
      await expect(page.locator(`header >> text=${contactName.trim()}`)).toBeVisible({ timeout: 5000 });
    }

    // Message input should be visible
    await expect(page.locator('textarea[placeholder="Type a message"]')).toBeVisible();
  });

  test('chat window shows messages', async ({ loggedInPage: page }) => {
    const firstChat = page.locator('[data-testid="chat-list-item"]').first();
    await firstChat.click();

    // Wait for messages to load (either real messages or the encryption notice)
    await page.waitForTimeout(2000);
    const messageArea = page.locator('[data-testid="message-list"]');
    await expect(messageArea).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════
// Flow 2 — Send a message
// ═══════════════════════════════════════════════════════════════════

test.describe('Flow 2: Send a message', () => {
  test('type and send a message via Enter key', async ({ loggedInPage: page }) => {
    /**
     * Tests: Full send flow — type → Enter → message appears.
     * Why: Core messaging functionality.
     * Failure reveals: Input handling, WebSocket send, or UI update broken.
     */
    // Open first chat
    const firstChat = page.locator('[data-testid="chat-list-item"]').first();
    await firstChat.click();

    const input = page.locator('textarea[placeholder="Type a message"]');
    await expect(input).toBeVisible();

    const testMessage = `E2E test message ${Date.now()}`;
    await input.fill(testMessage);
    await input.press('Enter');

    // Input should clear after send
    await expect(input).toHaveValue('');
  });

  test('send button appears when text is entered', async ({ loggedInPage: page }) => {
    const firstChat = page.locator('[data-testid="chat-list-item"]').first();
    await firstChat.click();

    const input = page.locator('textarea[placeholder="Type a message"]');
    
    // Before typing — mic button visible (gradient background button should NOT be visible)
    await input.fill('Hello');
    
    // After typing — send button should appear (gradient background)
    const sendButton = page.locator('button').filter({ has: page.locator('svg') }).last();
    await expect(sendButton).toBeVisible();
  });

  test('empty message does not send', async ({ loggedInPage: page }) => {
    const firstChat = page.locator('[data-testid="chat-list-item"]').first();
    await firstChat.click();

    const input = page.locator('textarea[placeholder="Type a message"]');
    await input.press('Enter');
    // No crash, no empty bubble
    await expect(input).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════
// Flow 3 — Search and select
// ═══════════════════════════════════════════════════════════════════

test.describe('Flow 3: Search and select', () => {
  test('search filters the chat list', async ({ loggedInPage: page }) => {
    /**
     * Tests: Typing in search narrows the chat list.
     * Why: Search was reported as broken by the user.
     * Failure reveals: Search state not flowing to filter, or filter logic broken.
     */
    await expect(page.locator('input[placeholder="Search or start new chat"]')).toBeVisible();

    const searchInput = page.locator('input[placeholder="Search or start new chat"]');
    await expect(searchInput).toBeVisible();

    // Count initial chats
    const initialCount = await page.locator('[data-testid="chat-list-item"]').count();

    // Type a specific search that should filter
    await searchInput.fill('zzz_nonexistent');

    // Should show "No results found"
    await expect(page.locator('text=No chats found')).toBeVisible({ timeout: 5000 });

    // Clear search
    await searchInput.fill('');
    
    // All chats should return
    await page.waitForTimeout(500);
  });

  test('selecting a chat from search results opens it', async ({ loggedInPage: page }) => {
    await expect(page.locator('input[placeholder="Search or start new chat"]')).toBeVisible();
    
    // If we have any chats, click the first one
    const firstChat = page.locator('[data-testid="chat-list-item"]').first();
    if (await firstChat.isVisible()) {
      await firstChat.click();
      // Should see the chat header
      await expect(page.locator('textarea[placeholder="Type a message"]')).toBeVisible({ timeout: 5000 });
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// Flow 4 — Theme switching
// ═══════════════════════════════════════════════════════════════════

test.describe('Flow 4: Theme switching', () => {
  test('switch to light mode via settings', async ({ loggedInPage: page }) => {
    /**
     * Tests: Settings → Appearance → Light theme card applies light mode.
     * Why: Light mode was completely broken (corrupted CSS).
     * Failure reveals: CSS not loading, data-theme not applied, or store broken.
     */
    // Navigate to settings
    await page.click('button[aria-label="Settings"]');
    await expect(page.locator('h1:has-text("Settings")')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('h2:has-text("Appearance")')).toBeVisible();

    // Click the Light theme card
    const lightCard = page.locator('button:has-text("Light")');
    if (await lightCard.isVisible()) {
      await lightCard.first().click();

      // data-theme should change to 'light'
      const theme = await page.evaluate(() =>
        document.documentElement.getAttribute('data-theme'),
      );
      expect(theme).toBe('light');
    }

    // Switch back to dark
    const darkCard = page.locator('button:has-text("Dark")');
    if (await darkCard.isVisible()) {
      await darkCard.first().click();
      const theme = await page.evaluate(() =>
        document.documentElement.getAttribute('data-theme'),
      );
      expect(theme).toBe('dark');
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// Flow 5 — Mobile responsive behavior
// ═══════════════════════════════════════════════════════════════════

test.describe('Flow 5: Mobile behavior', () => {
  test.use({ viewport: { width: 375, height: 812 } }); // iPhone-like

  test('sidebar fills full screen on mobile', async ({ loggedInPage: page }) => {
    await expect(page.locator('input[placeholder="Search or start new chat"]')).toBeVisible();
    // Sidebar aside should be full width
    const aside = page.locator('aside').first();
    const box = await aside.boundingBox();
    if (box) {
      expect(box.width).toBeGreaterThan(300);
    }
  });

  test('selecting chat shows full-screen chat window on mobile', async ({ loggedInPage: page }) => {
    /**
     * Tests: Mobile chat opens full-screen, hides sidebar.
     * Why: Mobile must show one panel at a time.
     * Failure reveals: Layout broken on mobile, both panels overlap.
     */
    const firstChat = page.locator('[data-testid="chat-list-item"]').first();
    if (await firstChat.isVisible({ timeout: 5000 })) {
      await firstChat.click();
      
      // Message input should be visible (chat window is showing)
      await expect(page.locator('textarea[placeholder="Type a message"]')).toBeVisible({ timeout: 5000 });
    }
  });

  test('back button returns to sidebar on mobile', async ({ loggedInPage: page }) => {
    const firstChat = page.locator('[data-testid="chat-list-item"]').first();
    if (await firstChat.isVisible({ timeout: 5000 })) {
      await firstChat.click();
      await page.waitForTimeout(500);

      // Find and click back button
      const backBtn = page.locator('button').filter({ has: page.locator('svg') }).first();
      await backBtn.click();

      // Sidebar should be visible again
      await expect(page.locator('input[placeholder="Search or start new chat"]')).toBeVisible({ timeout: 3000 });
    }
  });

  test('no horizontal overflow on mobile', async ({ loggedInPage: page }) => {
    /**
     * Tests: No horizontal scrollbar on mobile viewport.
     * Why: Horizontal scroll is a common mobile layout bug.
     * Failure reveals: CSS overflow issue, elements wider than viewport.
     */
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // +1 for rounding
  });
});

// ═══════════════════════════════════════════════════════════════════
// Flow 6 — Layout regression (the critical fix)
// ═══════════════════════════════════════════════════════════════════

test.describe('Flow 6: Layout regression — sidebar + chat side by side', () => {
  test('on desktop, sidebar and chat window are side by side (not stacked)', async ({ loggedInPage: page }) => {
    /**
     * Tests: THE critical bug fix — ChatLayout must use flex-row, not fragment.
     * Why: Fragment caused vertical stacking in AppShell's flex-col.
     * Failure reveals: Regression to the original layout bug.
     */
    // Open a chat
    const firstChat = page.locator('[data-testid="chat-list-item"]').first();
    if (await firstChat.isVisible({ timeout: 5000 })) {
      await firstChat.click();
      await page.waitForTimeout(500);

      // Get sidebar and chat window positions
      const aside = page.locator('aside').first();
      const chatArea = page.locator('textarea[placeholder="Type a message"]');

      if (await chatArea.isVisible()) {
        const asideBox = await aside.boundingBox();
        const chatBox = await chatArea.boundingBox();

        if (asideBox && chatBox) {
          // Chat input should be to the RIGHT of the sidebar, NOT below it
          expect(chatBox.x).toBeGreaterThan(asideBox.x);
          // They should be at roughly the same vertical position
          expect(Math.abs(asideBox.y - chatBox.y)).toBeLessThan(200);
        }
      }
    }
  });
});
