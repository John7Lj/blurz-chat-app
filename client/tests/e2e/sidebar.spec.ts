import { test, expect } from './fixtures';
import { ChatPage } from './pages/ChatPage';

test.describe('Chat list / Sidebar', () => {
  // removed parallel mode

  test('sidebar shows all chats on load', async ({ loggedInPage: page }) => {
    const chat = new ChatPage(page);
    // Wait for chats to load (skeleton disappears)
    await expect(chat.getSidebarItems().first()).toBeVisible({ timeout: 10_000 });
    const count = await chat.getSidebarItems().count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('search filters chat list by contact name', async ({ loggedInPage: page }) => {
    const chat = new ChatPage(page);
    await expect(chat.getSidebarItems().first()).toBeVisible({ timeout: 10_000 });

    await chat.search('UserB');
    await expect(chat.chatListItems.filter({ hasText: 'UserB' })).toBeVisible({ timeout: 5_000 });
  });

  test('search is case-insensitive', async ({ loggedInPage: page }) => {
    const chat = new ChatPage(page);
    await expect(chat.getSidebarItems().first()).toBeVisible({ timeout: 10_000 });

    await chat.search('userb');
    await expect(chat.chatListItems.filter({ hasText: /UserB/i })).toBeVisible({ timeout: 5_000 });
  });

  test('clearing search restores the full list', async ({ loggedInPage: page }) => {
    const chat = new ChatPage(page);
    await expect(chat.getSidebarItems().first()).toBeVisible({ timeout: 10_000 });
    const before = await chat.getSidebarItems().count();

    await chat.search('UserB');
    const during = await chat.getSidebarItems().count();
    expect(during).toBeLessThanOrEqual(before);

    await chat.getSearchInput().clear();
    await page.waitForTimeout(300);
    const after = await chat.getSidebarItems().count();
    expect(after).toBe(before);
  });

  test('search with no results shows empty state', async ({ loggedInPage: page }) => {
    const chat = new ChatPage(page);
    await expect(chat.getSidebarItems().first()).toBeVisible({ timeout: 10_000 });

    await chat.search('zzzzz_no_match_xyz');
    await expect(chat.noChatsMessage).toBeVisible({ timeout: 5_000 });
    expect(await chat.getSidebarItems().count()).toBe(0);
  });

  test('clicking a chat opens the chat window', async ({ loggedInPage: page }) => {
    const chat = new ChatPage(page);
    const firstItem = chat.getSidebarItems().first();
    await firstItem.waitFor({ state: 'visible', timeout: 10_000 });
    await firstItem.click();

    const messageInput = page.locator('textarea[placeholder="Type a message"]');
    await expect(messageInput).toBeVisible({ timeout: 8_000 });
  });

  test('active chat is highlighted in sidebar', async ({ loggedInPage: page }) => {
    const chat = new ChatPage(page);
    const firstItem = chat.getSidebarItems().first();
    await firstItem.waitFor({ state: 'visible', timeout: 10_000 });
    await firstItem.click();

    // The active item should have a visual indicator.
    // Our ChatListItem receives isActive prop — check for active class or aria-selected.
    const activeItem = chat.getSidebarItems().filter({ has: page.locator('[data-active="true"], .active, [aria-selected="true"]') });
    await expect(activeItem.first()).toBeVisible({ timeout: 5_000 });
  });

  test('chat list reorders when new message arrives via WebSocket', async ({ twoUserPages }) => {
    const { pageA, pageB } = twoUserPages;
    const chatA = new ChatPage(pageA);
    const chatB = new ChatPage(pageB);

    // pageA: make sure sidebar is loaded
    await expect(chatA.getSidebarItems().first()).toBeVisible({ timeout: 10_000 });

    // pageB: open chat with user_a and send a message
    await chatB.getSidebarItems().filter({ hasText: /UserA/i }).first().click();
    await chatB.sendMessage('Reorder test message');

    // pageA: the chat from user_b should move to the top
    // Wait for WebSocket delivery and sidebar update
    await expect(
      chatA.getSidebarItems().first(),
    ).toContainText(/UserB/i, { timeout: 10_000 });
  });

  test('unread badge appears for unread messages', async ({ twoUserPages }) => {
    const { pageA, pageB } = twoUserPages;
    const chatA = new ChatPage(pageA);
    const chatB = new ChatPage(pageB);

    // pageA stays on a different chat (or no chat)
    await expect(chatA.getSidebarItems().first()).toBeVisible({ timeout: 10_000 });

    // pageB sends a message to user_a
    await chatB.getSidebarItems().filter({ hasText: /UserA/i }).first().click();
    await chatB.sendMessage('Unread badge test');

    // pageA should show an unread badge on user_b's chat
    const badge = chatA.chatListItems
      .filter({ hasText: /UserB/i })
      .locator('[data-testid="unread-badge"]');
    await expect(badge).toBeVisible({ timeout: 10_000 });
  });

  test('unread badge disappears when chat is opened', async ({ twoUserPages }) => {
    const { pageA, pageB } = twoUserPages;
    const chatA = new ChatPage(pageA);
    const chatB = new ChatPage(pageB);

    // pageB sends to user_a (creating an unread)
    await expect(chatB.getSidebarItems().first()).toBeVisible({ timeout: 10_000 });
    await chatB.getSidebarItems().filter({ hasText: /UserA/i }).first().click();
    await chatB.sendMessage('Badge disappear test');

    // Wait for badge on pageA
    const badge = chatA.chatListItems
      .filter({ hasText: /UserB/i })
      .locator('[data-testid="unread-badge"]');
    await expect(badge).toBeVisible({ timeout: 10_000 });

    // pageA opens that chat
    await chatA.getSidebarItems().filter({ hasText: /UserB/i }).first().click();

    // Badge should disappear
    await expect(badge).not.toBeVisible({ timeout: 5_000 });
  });
});
