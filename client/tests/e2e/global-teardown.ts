import { FullConfig } from '@playwright/test';

const API = 'http://localhost:8000/api/v1';

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

export default async function globalTeardown(_config: FullConfig) {
  console.log('[global-teardown] Cleaning up test data…');
  // Placeholder: extend with DELETE /api/v1/test/cleanup if backend supports it.
  // For now we rely on seeded users persisting across runs (idempotent global-setup).
  console.log('[global-teardown] Done.');
}
