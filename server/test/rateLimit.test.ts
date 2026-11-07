import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ORIGIN, setupTestApp } from './helpers.js';

let ctx: Awaited<ReturnType<typeof setupTestApp>>;

beforeAll(async () => {
  ctx = await setupTestApp({ rateLimit: true });
});
afterAll(async () => ctx.close());

const requestCode = (email: string) =>
  ctx.app.inject({
    method: 'POST',
    url: '/api/auth/email/request',
    payload: { email },
    headers: { origin: ORIGIN },
  });

describe('rate limits for e-mail code requests', () => {
  it('limits per address, then per IP across addresses', async () => {
    for (let i = 0; i < 5; i++) expect((await requestCode('one@example.ch')).statusCode).toBe(204);
    const limited = await requestCode('ONE@example.ch'); // normalised to the same address
    expect(limited.statusCode).toBe(429);
    expect(limited.json()).toEqual({ error: 'RATE_LIMITED' });

    // Other addresses from the same IP still work …
    expect((await requestCode('two@example.ch')).statusCode).toBe(204);

    // … until the per-IP cap of 30 requests (the 5 above count, the 6th did not reach it).
    let status = 204;
    for (let i = 0; i < 30 && status === 204; i++) {
      status = (await requestCode(`many-${i}@example.ch`)).statusCode;
    }
    expect(status).toBe(429);
  });
});
