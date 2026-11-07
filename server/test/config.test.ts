import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';

const base = { AUTH_SECRET: 'x'.repeat(32) };

describe('config', () => {
  it('normalises APP_ORIGIN like the browser Origin header', () => {
    expect(loadConfig({ ...base, APP_ORIGIN: 'https://klavio.example.ch:443' }).APP_ORIGIN).toBe(
      'https://klavio.example.ch',
    );
    expect(loadConfig({ ...base, APP_ORIGIN: 'https://localhost:8443/' }).APP_ORIGIN).toBe(
      'https://localhost:8443',
    );
  });

  it('requires a long enough AUTH_SECRET', () => {
    expect(() => loadConfig({ AUTH_SECRET: 'short' })).toThrow(/AUTH_SECRET/);
  });
});
