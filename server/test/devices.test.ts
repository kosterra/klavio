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

async function signUp(jar: CookieJar, email: string) {
  await call(jar, 'POST', '/api/auth/email/request', { email });
  const code = /(\d{6})/.exec(ctx.outbox.at(-1)!.text)![1];
  await call(jar, 'POST', '/api/auth/email/verify', { email, code, displayName: 'Familie Muster' });
}

const year = new Date().getFullYear();

describe("children log in with their own PIN on a child's device", () => {
  it('parent sets PINs and the device; the child logs in and stays in their profile', async () => {
    const jar = new CookieJar();
    await signUp(jar, 'family@example.ch');
    const lina = (
      await call(jar, 'POST', '/api/profiles', { name: 'Lina', birthYear: year - 9 })
    ).json();
    const tim = (
      await call(jar, 'POST', '/api/profiles', { name: 'Tim', birthYear: year - 7 })
    ).json();
    expect(lina.hasPin).toBe(false);

    // a PIN for Lina only; Tim has none and is not offered on the device
    expect(
      (await call(jar, 'PUT', `/api/profiles/${lina.id}/pin`, { pin: '12a4' })).statusCode,
    ).toBe(400);
    expect(
      (await call(jar, 'PUT', `/api/profiles/${lina.id}/pin`, { pin: '4711' })).statusCode,
    ).toBe(204);

    // this browser becomes the children's device
    const device = await call(jar, 'POST', '/api/devices', { name: 'Klavier im Wohnzimmer' });
    expect(device.statusCode).toBe(201);
    expect((await call(jar, 'GET', '/api/devices')).json()).toMatchObject([
      { name: 'Klavier im Wohnzimmer', current: true, lastUsedAt: null },
    ]);
    await call(jar, 'POST', '/api/auth/logout');
    expect((await call(jar, 'GET', '/api/auth/me')).statusCode).toBe(401);

    // «Wer spielt?»
    const who = await call(jar, 'GET', '/api/device/profiles');
    expect(who.json()).toEqual({
      family: 'Familie Muster',
      profiles: [{ id: lina.id, name: 'Lina', avatar: lina.avatar, outfit: null }],
    });

    // a wrong PIN, then the right one
    expect(
      (await call(jar, 'POST', '/api/device/login', { profileId: lina.id, pin: '0000' }))
        .statusCode,
    ).toBe(403);
    expect(
      (await call(jar, 'POST', '/api/device/login', { profileId: tim.id, pin: '4711' })).statusCode,
    ).toBe(404);
    const login = await call(jar, 'POST', '/api/device/login', { profileId: lina.id, pin: '4711' });
    expect(login.statusCode).toBe(200);
    const me = (await call(jar, 'GET', '/api/auth/me')).json();
    expect(me.activeProfileId).toBe(lina.id);
    expect(me.childLogin).toBe(true);

    // Lina stays Lina, and the parent area stays closed (even without a parent PIN)
    expect(
      (await call(jar, 'POST', '/api/profiles/select', { profileId: tim.id })).statusCode,
    ).toBe(403);
    expect((await call(jar, 'GET', '/api/devices')).statusCode).toBe(403);
    expect(
      (await call(jar, 'PUT', `/api/profiles/${lina.id}/pin`, { pin: '1111' })).statusCode,
    ).toBe(403);

    // after logging out, the device still asks «Wer spielt?»
    await call(jar, 'POST', '/api/auth/logout');
    expect((await call(jar, 'GET', '/api/device/profiles')).statusCode).toBe(200);
  });

  it('wrong PINs lock the profile for a while; a parent can remove the device', async () => {
    const parent = new CookieJar();
    await signUp(parent, 'lock@example.ch');
    const lina = (
      await call(parent, 'POST', '/api/profiles', { name: 'Lina', birthYear: year - 9 })
    ).json();
    await call(parent, 'PUT', `/api/profiles/${lina.id}/pin`, { pin: '4711' });
    await call(parent, 'POST', '/api/devices', { name: 'Tablet' });
    const deviceCookie = parent.header;

    const child = new CookieJar();
    const [name, value] = deviceCookie
      .split('; ')
      .find((c) => c.startsWith('klavio_device='))!
      .split('=') as [string, string];
    child.store({ cookies: [{ name, value }] });
    for (let i = 0; i < 5; i++)
      await call(child, 'POST', '/api/device/login', { profileId: lina.id, pin: '0000' });
    expect(
      (await call(child, 'POST', '/api/device/login', { profileId: lina.id, pin: '4711' }))
        .statusCode,
    ).toBe(429);

    // without a device cookie there is nothing to log in to
    expect(
      (
        await call(new CookieJar(), 'POST', '/api/device/login', {
          profileId: lina.id,
          pin: '4711',
        })
      ).statusCode,
    ).toBe(403);

    const [dev] = (await call(parent, 'GET', '/api/devices')).json();
    expect((await call(parent, 'DELETE', `/api/devices/${dev.id}`)).statusCode).toBe(204);
    expect((await call(child, 'GET', '/api/device/profiles')).statusCode).toBe(404);
  });
});
