import { chromium, FullConfig } from '@playwright/test';

const API = 'http://localhost:8000/api/v1';

const TEST_USERS = [
  { first_name: 'UserA', last_name: 'Test', email: 'user_a@test.com', password: 'Test1234!', username: 'user_a', phone: '1234567890', profile_picture: null },
  { first_name: 'UserB', last_name: 'Test', email: 'user_b@test.com', password: 'Test1234!', username: 'user_b', phone: '1234567891', profile_picture: null },
  { first_name: 'UserC', last_name: 'Test', email: 'user_c@test.com', password: 'Test1234!', username: 'user_c', phone: '1234567892', profile_picture: null },
];

async function registerUser(user: (typeof TEST_USERS)[number]) {
  const res = await fetch(`${API}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  // 200 = created, 400 = already exists — both are fine for seeding
  if (!res.ok && res.status !== 400) {
    const body = await res.text();
    console.warn(`[global-setup] register ${user.email}: ${res.status} ${body}`);
  }
}

async function loginUser(email: string, password: string): Promise<string> {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Login failed for ${email}: ${res.status}`);
  const data = await res.json();
  return data.access_token as string;
}

// Seed a chat between two users so the sidebar is populated
async function seedChat(tokenA: string, tokenB: string) {
  // Get user_b's ID so user_a can start a chat
  const resB = await fetch(`${API}/users/me`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  if (!resB.ok) return;
  const userB = await resB.json();

  const res = await fetch(`${API}/chats/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({ recipient_id: userB.id, message: 'Hello' }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.warn(`[global-setup] seedChat: ${res.status} ${body}`);
  }
}

export default async function globalSetup(_config: FullConfig) {
  console.log('[global-setup] Seeding test users…');

  // Register all users (idempotent)
  await Promise.all(TEST_USERS.map(registerUser));

  // Login to get tokens
  const [tokenA, tokenB, tokenC] = await Promise.all([
    loginUser('user_a@test.com', 'Test1234!'),
    loginUser('user_b@test.com', 'Test1234!'),
    loginUser('user_c@test.com', 'Test1234!'),
  ]);

  // Seed chats between the users
  await seedChat(tokenA, tokenB);
  await seedChat(tokenA, tokenC);
  await seedChat(tokenB, tokenC);

  console.log('[global-setup] Done.');
}
