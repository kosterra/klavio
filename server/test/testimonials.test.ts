import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { CookieJar, ORIGIN, setupTestApp } from './helpers.js';
import { User } from '../src/models/index.js';

let ctx: Awaited<ReturnType<typeof setupTestApp>>;
beforeAll(async () => {
  ctx = await setupTestApp();
});
afterAll(async () => ctx.close());
beforeEach(async () => ctx.reset());

const call = async (
  jar: CookieJar,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT',
  url: string,
  payload?: unknown,
) => {
  const res = await ctx.app.inject({
    method,
    url,
    payload: payload as object,
    headers: { origin: ORIGIN, cookie: jar.header },
  });
  jar.store(res);
  return res;
};

async function account(email: string) {
  const jar = new CookieJar();
  await call(jar, 'POST', '/api/auth/email/request', { email });
  const code = /(\d{6})/.exec(ctx.outbox.at(-1)!.text)![1];
  await call(jar, 'POST', '/api/auth/email/verify', { email, code, displayName: 'Familie' });
  return jar;
}

const words = {
  text: 'Unsere Tochter übt jetzt fast jeden Tag – freiwillig!',
  author: 'Andrea',
  role: 'Mutter von zwei Kindern',
  consent: true,
};

describe('testimonials', () => {
  it('need consent, are shown only after approval, and can be taken back', async () => {
    const parent = await account('parent@example.ch');
    expect(
      (await call(parent, 'POST', '/api/testimonials', { ...words, consent: false })).statusCode,
    ).toBe(400);
    const created = await call(parent, 'POST', '/api/testimonials', words);
    expect(created.statusCode).toBe(201);
    const id = created.json().id as string;
    expect(created.json().status).toBe('pending');

    // not public yet
    expect((await ctx.app.inject({ url: '/api/testimonials/public' })).json()).toEqual([]);

    // a normal user cannot approve
    expect(
      (await call(parent, 'PATCH', `/api/testimonials/${id}`, { status: 'approved' })).statusCode,
    ).toBe(403);

    const admin = await account('admin@example.ch');
    await User.updateOne({ email: 'admin@example.ch' }, { role: 'admin' });
    expect((await call(admin, 'GET', '/api/testimonials/all')).json()).toHaveLength(1);
    expect(
      (await call(admin, 'PATCH', `/api/testimonials/${id}`, { status: 'approved' })).json().status,
    ).toBe('approved');
    expect((await ctx.app.inject({ url: '/api/testimonials/public' })).json()).toEqual([
      { text: words.text, author: 'Andrea', role: 'Mutter von zwei Kindern' },
    ]);

    // with a parent PIN set and locked, a child cannot write in the family's name
    await call(parent, 'PUT', '/api/account/pin', { pin: '2468' });
    await call(parent, 'POST', '/api/account/pin/lock');
    expect((await call(parent, 'POST', '/api/testimonials', words)).statusCode).toBe(403);
    await call(parent, 'POST', '/api/account/pin/verify', { pin: '2468' });

    // taken back: gone from the public page
    expect((await call(parent, 'DELETE', `/api/testimonials/${id}`)).statusCode).toBe(204);
    expect((await ctx.app.inject({ url: '/api/testimonials/public' })).json()).toEqual([]);
  });
});
