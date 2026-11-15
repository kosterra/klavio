import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ORIGIN, setupTestApp } from './helpers.js';

// own app instance: the in-memory rate-limit counters must start empty
let ctx: Awaited<ReturnType<typeof setupTestApp>>;
beforeAll(async () => {
  ctx = await setupTestApp({ rateLimit: true });
});
afterAll(async () => ctx.close());

describe('rate limit for library files', () => {
  it('allows 20 files a minute per account', async () => {
    const email = 'files@example.ch';
    await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/email/request',
      payload: { email },
      headers: { origin: ORIGIN },
    });
    const code = /(\d{6})/.exec(ctx.outbox.at(-1)!.text)![1];
    const login = await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/email/verify',
      payload: { email, code, displayName: 'F' },
      headers: { origin: ORIGIN },
    });
    const cookie = login.cookies.map((c) => `${c.name}=${c.value}`).join('; ');
    const file = () =>
      ctx.app.inject({
        method: 'GET',
        url: '/api/library/Fur_Elise.mxl/file',
        headers: { cookie },
      });
    // (the library is off here: 404 – the requests still count)
    for (let i = 0; i < 20; i++) expect((await file()).statusCode).toBe(404);
    expect((await file()).statusCode).toBe(429);
  });
});
