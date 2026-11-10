import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { LightMyRequestResponse } from 'fastify';
import { CookieJar, ORIGIN, setupTestApp } from './helpers.js';

let ctx: Awaited<ReturnType<typeof setupTestApp>>;

beforeAll(async () => {
  ctx = await setupTestApp();
});
afterAll(async () => ctx.close());
beforeEach(async () => ctx.reset());

async function call(
  jar: CookieJar,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  payload?: unknown,
): Promise<LightMyRequestResponse> {
  const res = await ctx.app.inject({
    method,
    url,
    payload: payload as object,
    headers: { origin: ORIGIN, cookie: jar.header },
  });
  jar.store(res);
  return res;
}

async function signUp(jar: CookieJar, email: string, role: 'user' | 'admin' = 'user') {
  await call(jar, 'POST', '/api/auth/email/request', { email });
  const code = /(\d{6})/.exec(ctx.outbox.at(-1)!.text)![1];
  await call(jar, 'POST', '/api/auth/email/verify', { email, code, displayName: 'Test' });
  if (role === 'admin') {
    const { User } = await import('../src/models/index.js');
    await User.updateOne({ email }, { role: 'admin' });
  }
}

describe('profiles: birth year and worlds', () => {
  const year = new Date().getFullYear();

  it('needs a birth year; the journey only from the minimum age', async () => {
    const jar = new CookieJar();
    await signUp(jar, 'family@example.ch');
    expect((await call(jar, 'POST', '/api/profiles', { name: 'Lina' })).statusCode).toBe(400);
    expect(
      (await call(jar, 'POST', '/api/profiles', { name: 'Lina', birthYear: year + 1 })).statusCode,
    ).toBe(400);

    const young = await call(jar, 'POST', '/api/profiles', {
      name: 'Lina',
      birthYear: year - 8,
      world: 'journey',
    });
    expect(young.statusCode).toBe(400);
    expect(young.json().error).toBe('WORLD_TOO_YOUNG');

    const adult = await call(jar, 'POST', '/api/profiles', {
      name: 'Ralph',
      birthYear: 1985,
      uiMode: 'classic',
      world: 'journey',
    });
    expect(adult.statusCode).toBe(201);
    expect(adult.json()).toMatchObject({ birthYear: 1985, world: 'journey' });

    // a corrected birth year below the minimum age brings back the kids' worlds
    const fixed = await call(jar, 'PATCH', `/api/profiles/${adult.json().id}`, {
      birthYear: year - 9,
    });
    expect(fixed.json()).toMatchObject({ birthYear: year - 9, world: null });
    const again = await call(jar, 'PATCH', `/api/profiles/${adult.json().id}`, {
      world: 'journey',
    });
    expect(again.json().error).toBe('WORLD_TOO_YOUNG');
  });

  it('follows the minimum age admins set', async () => {
    const admin = new CookieJar();
    await signUp(admin, 'admin@example.ch', 'admin');
    expect((await ctx.app.inject({ method: 'GET', url: '/api/config' })).json().journeyMinAge).toBe(
      12,
    );
    await call(admin, 'PUT', '/api/admin/settings', { journeyMinAge: 8 });
    expect((await ctx.app.inject({ method: 'GET', url: '/api/config' })).json().journeyMinAge).toBe(
      8,
    );
    const kid = await call(admin, 'POST', '/api/profiles', {
      name: 'Mia',
      birthYear: year - 8,
      world: 'journey',
    });
    expect(kid.statusCode).toBe(201);
    expect(
      (await call(admin, 'PUT', '/api/admin/settings', { journeyMinAge: 120 })).statusCode,
    ).toBe(400);
  });
});
