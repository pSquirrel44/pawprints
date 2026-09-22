import assert from 'node:assert/strict';
import test from 'node:test';
import { api, setApiTokenProvider } from '../src/lib/api';

test('protected API calls use a fresh Clerk token instead of a stored token', async () => {
  const originalFetch = globalThis.fetch;
  let authorization = '';

  globalThis.fetch = (async (_input, init) => {
    authorization = new Headers(init?.headers).get('Authorization') || '';
    return new Response(JSON.stringify({ id: 1 }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;

  setApiTokenProvider(async () => 'fresh-session-token');

  try {
    await api.createPost({ content: 'hello' }, 'stale-login-token');
    assert.equal(authorization, 'Bearer fresh-session-token');
  } finally {
    setApiTokenProvider(null);
    globalThis.fetch = originalFetch;
  }
});
