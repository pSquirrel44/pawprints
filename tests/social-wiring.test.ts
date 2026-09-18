import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const serverSource = readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
const usersRouteSource = readFileSync(new URL('../server/routes/users.ts', import.meta.url), 'utf8');
const authSource = readFileSync(new URL('../server/middleware/auth.ts', import.meta.url), 'utf8');

test('social API parses JSON before mounting social routers', () => {
  const parser = serverSource.indexOf("app.use('/api', express.json({ limit: '25mb' }))");
  const usersRouter = serverSource.indexOf("app.use('/api/users', usersRouter)");
  const postsRouter = serverSource.indexOf("app.use('/api/posts', postsRouter)");

  assert.notEqual(parser, -1, 'the API JSON parser must be mounted');
  assert.ok(parser < usersRouter, 'the JSON parser must run before the users router');
  assert.ok(parser < postsRouter, 'the JSON parser must run before the posts router');
});

test('user sync authenticates with Clerk without requiring an existing graph row', () => {
  assert.match(authSource, /export function requireClerkAuth/);
  assert.match(usersRouteSource, /router\.post\('\/sync', requireClerkAuth,/);
  assert.doesNotMatch(usersRouteSource, /router\.post\('\/sync', requireAuth,/);
});
