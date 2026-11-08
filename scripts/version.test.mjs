import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextVersion } from './version.mjs';

test('the sequence goes up within a month and starts at 0 in a new one', () => {
  assert.equal(nextVersion('2026.11.0', new Date(2026, 10, 30)), '2026.11.1');
  assert.equal(nextVersion('2026.11.4', new Date(2026, 11, 1)), '2026.12.0');
  assert.equal(nextVersion('2026.12.3', new Date(2027, 0, 2)), '2027.1.0');
  assert.equal(nextVersion('0.1.0', new Date(2026, 10, 8)), '2026.11.0');
});
