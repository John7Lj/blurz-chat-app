import { test, expect } from './fixtures';
import { ChatPage } from './pages/ChatPage';
import { generateString } from './helpers';

test.describe('Messaging — sending', () => {
  // removed parallel mode

  test('user can send a message', async ({ chatPage: page }) => {
    const chat = new ChatPage(page);
    const msg = `Hello from E2E test ${Date.now()}`;

    await chat.sendMessage(msg);

    await expect(
      chat.getMessages().filter({ hasText: msg }),
    ).toBeVisible({ timeout: 8_000 });

    // Input clears
    await expect(chat.messageInput).toHaveValue('');
  });

  test('send button replaces mic when typing', async ({ chatPage: page }) => {
    const chat = new ChatPage(page);

    // Empty input → mic visible
    await expect(chat.micButton).toBeVisible();
    await expect(chat.sendButton).not.toBeVisible();

    // Type one character → send button visible
    await chat.messageInput.fill('x');
    await expect(chat.sendButton).toBeVisible();
    await expect(chat.micButton).not.toBeVisible();

    // Clear → mic visible again
    await chat.messageInput.clear();
    await expect(chat.micButton).toBeVisible();
    await expect(chat.sendButton).not.toBeVisible();
  });

  test('clicking send button sends message', async ({ chatPage: page }) => {
    const chat = new ChatPage(page);
    const msg = `Click send ${Date.now()}`;

    await chat.messageInput.fill(msg);
    await chat.sendButton.click();

    await expect(
      chat.getMessages().filter({ hasText: msg }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('pressing Enter key sends message', async ({ chatPage: page }) => {
    const chat = new ChatPage(page);
    const msg = `Enter test ${Date.now()}`;

    await chat.messageInput.fill(msg);
    await chat.messageInput.press('Enter');

    await expect(
      chat.getMessages().filter({ hasText: msg }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('empty input does not send a message', async ({ chatPage: page }) => {
    const chat = new ChatPage(page);
    const before = await chat.getMessages().count();

    // Input is already empty — press Enter
    await chat.messageInput.press('Enter');

    await page.waitForTimeout(500);
    const after = await chat.getMessages().count();
    expect(after).toBe(before);
    await expect(chat.messageInput).toHaveValue('');
  });

  test('whitespace-only input does not send', async ({ chatPage: page }) => {
    const chat = new ChatPage(page);
    const before = await chat.getMessages().count();

    await chat.messageInput.fill('     ');
    await chat.messageInput.press('Enter');

    await page.waitForTimeout(500);
    const after = await chat.getMessages().count();
    expect(after).toBe(before);
  });

  test('very long message (1000 chars) sends correctly', async ({ chatPage: page }) => {
    const chat = new ChatPage(page);
    const msg = generateString(1000);

    await chat.messageInput.fill(msg);
    await chat.sendButton.click();

    const bubble = chat.getMessages().filter({ hasText: msg.slice(0, 50) });
    await expect(bubble).toBeVisible({ timeout: 10_000 });

    // Bubble must not overflow the chat window width
    const chatArea = page.locator('[data-testid="chat-window"]');
    const chatBox  = await chatArea.boundingBox();
    const bubbleBox = await bubble.boundingBox();
    if (chatBox && bubbleBox) {
      expect(bubbleBox.x + bubbleBox.width).toBeLessThanOrEqual(chatBox.x + chatBox.width + 2);
    }
  });

  test('sending multiple messages rapidly all appear in correct order', async ({ chatPage: page }) => {
    const chat = new ChatPage(page);
    const msgs = Array.from({ length: 5 }, (_, i) => `Rapid msg ${i + 1}`);

    for (const m of msgs) {
      await chat.messageInput.fill(m);
      await chat.messageInput.press('Enter');
    }

    // All 5 must be visible
    for (const m of msgs) {
      await expect(chat.getMessages().filter({ hasText: m })).toBeVisible({ timeout: 10_000 });
    }

    // Check order: the 5th should come after the 1st in DOM
    const allTexts = await chat.getMessages().allTextContents();
    const indices = msgs.map((m) => allTexts.findIndex((t) => t.includes(m)));
    for (let i = 1; i < indices.length; i++) {
      expect(indices[i]).toBeGreaterThan(indices[i - 1]);
    }
  });

  test('sidebar updates after sending a message', async ({ chatPage: page }) => {
    const chat = new ChatPage(page);
    const msg = `Updated preview ${Date.now()}`;

    await chat.sendMessage(msg);

    // The sidebar's last-message preview should update
    const preview = page.locator('[data-testid="chat-list-item"] [data-testid="last-message"]');
    await expect(preview.first()).toContainText(msg, { timeout: 8_000 });
  });
});

// ── Receiving ────────────────────────────────────────────────────────────────

test.describe('Messaging — receiving', () => {
  // removed parallel mode

  test('message received from other user appears in real time', async ({ twoUserPages }) => {
    const { pageA, pageB } = twoUserPages;
    const chatA = new ChatPage(pageA);
    const chatB = new ChatPage(pageB);

    // pageA opens chat with user_b
    await chatA.getSidebarItems().filter({ hasText: /UserB/i }).first().click();
    const inputA = chatA.messageInput;
    await expect(inputA).toBeVisible({ timeout: 8_000 });

    // pageB opens chat with user_a and sends
    await chatB.getSidebarItems().filter({ hasText: /UserA/i }).first().click();
    const msgText = `Hi from user_b ${Date.now()}`;
    await chatB.sendMessage(msgText);

    // pageA should receive without refresh
    await expect(
      chatA.getMessages().filter({ hasText: msgText }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('sender does NOT see their own message twice', async ({ chatPage: page }) => {
    const chat = new ChatPage(page);
    const msg = `Dedup test ${Date.now()}`;
    const before = await chat.getMessages().count();

    await chat.sendMessage(msg);

    await expect(
      chat.getMessages().filter({ hasText: msg }),
    ).toBeVisible({ timeout: 8_000 });

    await page.waitForTimeout(1_000); // allow any duplicate to appear
    const matching = await chat.getMessages().filter({ hasText: msg }).count();
    expect(matching).toBe(1);
  });

  test('incoming message while scrolled up shows floating button', async ({ twoUserPages }) => {
    const { pageA, pageB } = twoUserPages;
    const chatA = new ChatPage(pageA);
    const chatB = new ChatPage(pageB);

    // pageA opens the chat
    await chatA.getSidebarItems().filter({ hasText: /UserB/i }).first().click();
    await expect(chatA.messageInput).toBeVisible({ timeout: 8_000 });

    // Scroll to top
    await chatA.scrollToTop();

    // pageB sends a message
    await chatB.getSidebarItems().filter({ hasText: /UserA/i }).first().click();
    await chatB.sendMessage(`New msg while scrolled up ${Date.now()}`);

    // Floating "new message" button should appear
    await expect(chatA.getNewMessageButton()).toBeVisible({ timeout: 10_000 });

    // Click it
    await chatA.clickNewMessageButton();

    // Button disappears
    await expect(chatA.getNewMessageButton()).not.toBeVisible({ timeout: 5_000 });
  });

  test('messages arrive in correct order under load', async ({ twoUserPages }) => {
    const { pageA, pageB } = twoUserPages;
    const chatA = new ChatPage(pageA);
    const chatB = new ChatPage(pageB);

    // pageA watches chat
    await chatA.getSidebarItems().filter({ hasText: /UserB/i }).first().click();
    await expect(chatA.messageInput).toBeVisible({ timeout: 8_000 });

    // pageB sends 10 messages
    await chatB.getSidebarItems().filter({ hasText: /UserA/i }).first().click();
    const messages = Array.from({ length: 10 }, (_, i) => `Order test ${i + 1}`);
    for (const m of messages) {
      await chatB.messageInput.fill(m);
      await chatB.messageInput.press('Enter');
    }

    // All 10 must appear on pageA
    for (const m of messages) {
      await expect(chatA.getMessages().filter({ hasText: m })).toBeVisible({ timeout: 15_000 });
    }

    // Verify order in DOM
    const allTexts = await chatA.getMessages().allTextContents();
    const indices = messages.map((m) => allTexts.findIndex((t) => t.includes(m)));
    for (let i = 1; i < indices.length; i++) {
      expect(indices[i]).toBeGreaterThan(indices[i - 1]);
    }
  });
});
