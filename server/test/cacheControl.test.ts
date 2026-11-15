import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { setupTestApp } from './helpers.js';

let ctx: Awaited<ReturnType<typeof setupTestApp>>;
beforeAll(async () => {
  ctx = await setupTestApp();
});
afterAll(async () => ctx.close());

const get = (url: string) => ctx.app.inject({ method: 'GET', url });

describe('API responses are not cached', () => {
  it('sends no-store on answers, errors and unknown API paths', async () => {
    for (const url of ['/api/health', '/api/config', '/api/auth/me', '/api/nothing-here']) {
      const res = await get(url);
      expect(res.headers['cache-control'], url).toBe('no-store');
    }
    expect((await get('/api/auth/me')).statusCode).toBe(401);
  });
});
