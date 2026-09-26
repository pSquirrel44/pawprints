import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getPathUsername } from '../src/lib/utils';

test('reads the username after the section', () => {
  assert.equal(getPathUsername('/messages/ricky', 'messages'), 'ricky');
  assert.equal(getPathUsername('/profile/maxx/', 'profile'), 'maxx');
  assert.equal(getPathUsername('/messages/pop%20corn', 'messages'), 'pop corn');
});

test('returns undefined when there is no username or wrong section', () => {
  assert.equal(getPathUsername('/messages', 'messages'), undefined);
  assert.equal(getPathUsername('/', 'messages'), undefined);
  assert.equal(getPathUsername('/profile/ricky', 'messages'), undefined);
});
