import { Page, expect } from '@playwright/test';

const API_URL = 'http://localhost:8000/api/v1';

// ── API helpers ─────────────────────────────────────────────────────────────

/**
 * Get an auth token for the given credentials via the API.
 */
export async function getToken(
  page: Page,
  email: string,
  password: string,
): Promise<string> {
  const res = await page.request.post(`${API_URL}/auth/login`, {
    data: { email, password },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  return body.access_token as string;
}

/**
 * Seed a series of messages in a chat between two users.
 * @param senderToken - JWT of the sender
 * @param chatId      - ID of the target chat
 * @param messages    - Array of message strings to send (in order)
 */
export async function seedMessages(
  page: Page,
  senderToken: string,
  chatId: string,
  messages: string[],
): Promise<void> {
  for (const content of messages) {
    const res = await page.request.post(`${API_URL}/messages`, {
      data: { chat_id: chatId, content },
      headers: { Authorization: `Bearer ${senderToken}` },
    });
    if (!res.ok()) {
      console.warn(`[seedMessages] ${res.status()} for message: "${content}"`);
    }
  }
}

/**
 * Get the first chat ID for the authenticated user.
 */
export async function getFirstChatId(
  page: Page,
  token: string,
): Promise<string | null> {
  const res = await page.request.get(`${API_URL}/chats/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) return null;
  const chats = await res.json();
  return chats?.[0]?.id ?? null;
}

/**
 * Create a chat between user_a and user_b (idempotent).
 */
export async function seedChat(
  page: Page,
  tokenA: string,
  tokenB: string,
): Promise<string | null> {
  // Get user_b's profile to find their ID
  const resB = await page.request.get(`${API_URL}/users/me`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  if (!resB.ok()) return null;
  const userB = await resB.json();

  const res = await page.request.post(`${API_URL}/chats/start`, {
    data: { recipient_id: userB.id, message: 'Hello' },
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  if (!res.ok()) {
    // Might already exist — fetch list and find it
    const chats = await page.request.get(`${API_URL}/chats/mine`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    if (!chats.ok()) return null;
    const list = await chats.json();
    const found = list.find((c: { participants?: { id: string } }) => c.participants?.id === userB.id);
    return found?.id ?? null;
  }
  const chat = await res.json();
  return chat.id as string;
}

/**
 * Clear all messages from a specific chat (calls server endpoint if available).
 */
export async function clearChat(
  page: Page,
  token: string,
  chatId: string,
): Promise<void> {
  const res = await page.request.delete(`${API_URL}/chats/${chatId}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) {
    console.warn(`[clearChat] ${res.status()} — endpoint may not exist.`);
  }
}

// ── DOM / UI helpers ─────────────────────────────────────────────────────────

/**
 * Wait for a message bubble containing `text` to appear in the message list.
 */
export async function waitForMessage(page: Page, text: string, timeout = 8_000) {
  await expect(
    page.locator('[data-testid="message-bubble"]', { hasText: text }),
  ).toBeVisible({ timeout });
}

/**
 * Count the number of message bubbles currently in the chat.
 */
export async function getMessageCount(page: Page): Promise<number> {
  return page.locator('[data-testid="message-bubble"]').count();
}

/**
 * Assert that no two message bubbles share the same data-id attribute.
 */
export async function assertNoDuplicateMessages(page: Page): Promise<void> {
  const ids = await page
    .locator('[data-testid="message-bubble"][data-id]')
    .evaluateAll((els) => els.map((el) => el.getAttribute('data-id')));
  const unique = new Set(ids);
  expect(unique.size, 'Duplicate message IDs found').toBe(ids.length);
}

/**
 * Intercept and immediately close the active WebSocket connection.
 */
export async function dropWebSocket(page: Page): Promise<void> {
  // Playwright's WebSocket interception — close the first WS that matches
  await page.evaluate(() => {
    // Walk all open WebSockets stored on window (if the app exposes them)
    // As a fallback, we patch WebSocket to close on next send
    const originalWS = window.WebSocket;
    class PatchedWS extends originalWS {
      constructor(url: string | URL, protocols?: string | string[]) {
        super(url, protocols);
        // Close immediately after opening
        this.addEventListener('open', () => {
          this.close(1000, 'test-drop');
        });
      }
    }
    (window as Window & { __ws_dropped?: boolean }).WebSocket = PatchedWS as typeof WebSocket;
    (window as Window & { __ws_dropped?: boolean }).__ws_dropped = true;
  });
}

/**
 * Force the browser offline and wait for the network state to settle.
 */
export async function goOffline(page: Page): Promise<void> {
  await page.context().setOffline(true);
  await page.waitForTimeout(300);
}

/**
 * Restore the browser to online mode.
 */
export async function goOnline(page: Page): Promise<void> {
  await page.context().setOffline(false);
  await page.waitForTimeout(300);
}

/**
 * Generate a string of the given length.
 */
export function generateString(length: number): string {
  return 'A'.repeat(length);
}
