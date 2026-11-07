import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ORIGIN, setupTestApp } from './helpers.js';

// own app instance: the in-memory rate-limit counters must start empty
let ctx: Awaited<ReturnType<typeof setupTestApp>>;
beforeAll(async () => {
  ctx = await setupTestApp({ rateLimit: true });
});
afterAll(async () => ctx.close());

describe('parent PIN rate limit', () => {
  it('slows down guessing the parent PIN (per account)', async () => {
    const email = 'pin@example.ch';
    const cookie = { value: '' };
    const send = (method: 'POST' | 'PUT', url: string, payload: object) =>
      ctx.app.inject({ method, url, payload, headers: { origin: ORIGIN, cookie: cookie.value } });
    await send('POST', '/api/auth/email/request', { email });
    const code = /(\d{6})/.exec(ctx.outbox.at(-1)!.text)![1];
    const login = await send('POST', '/api/auth/email/verify', { email, code, displayName: 'P' });
    cookie.value = login.cookies.map((c) => `${c.name}=${c.value}`).join('; ');
    await send('PUT', '/api/account/pin', { pin: '2468' });
    const codes = [];
    for (let i = 0; i < 6; i++) {
      codes.push((await send('POST', '/api/account/pin/verify', { pin: '0000' })).statusCode);
    }
    expect(codes).toEqual([403, 403, 403, 403, 403, 429]);
  });
});
