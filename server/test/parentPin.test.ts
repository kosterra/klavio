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
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
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

async function family() {
  const jar = new CookieJar();
  const email = 'eltern@example.ch';
  await call(jar, 'POST', '/api/auth/email/request', { email });
  const code = /(\d{6})/.exec(ctx.outbox.at(-1)!.text)![1];
  await call(jar, 'POST', '/api/auth/email/verify', { email, code, displayName: 'Familie' });
  const kid = (await call(jar, 'POST', '/api/profiles', { name: 'Lina', birthYear: 2016 })).json();
  return { jar, kid };
}

const LOCKED = { error: 'PARENT_LOCKED' };

describe('parent PIN', () => {
  it('without a PIN nothing is locked', async () => {
    const { jar, kid } = await family();
    await call(jar, 'POST', '/api/profiles/select', { profileId: kid.id });
    const me = (await call(jar, 'GET', '/api/auth/me')).json();
    expect(me.user.parentPin).toEqual({
      set: false,
      unlockedUntil: null,
      passkey: false,
      passkeyEnabled: false,
    });
    expect((await call(jar, 'GET', '/api/passkeys')).statusCode).toBe(200);
  });

  it('locks the parent area after handing over to a child, unlocks with the PIN', async () => {
    const { jar, kid } = await family();
    expect((await call(jar, 'PUT', '/api/account/pin', { pin: '2468' })).statusCode).toBe(204);
    expect((await call(jar, 'GET', '/api/auth/me')).json().user.parentPin.set).toBe(true);

    // choosing the child's profile hands the device over
    await call(jar, 'POST', '/api/profiles/select', { profileId: kid.id });
    expect((await call(jar, 'GET', '/api/auth/me')).json().user.parentPin.unlockedUntil).toBeNull();

    // parent area is closed …
    expect((await call(jar, 'GET', '/api/passkeys')).json()).toEqual(LOCKED);
    expect(
      (await call(jar, 'POST', '/api/profiles', { name: 'Ben', birthYear: 2018 })).json(),
    ).toEqual(LOCKED);
    expect((await call(jar, 'PATCH', `/api/profiles/${kid.id}`, { name: 'X' })).json()).toEqual(
      LOCKED,
    );
    expect((await call(jar, 'DELETE', `/api/profiles/${kid.id}`)).json()).toEqual(LOCKED);
    expect((await call(jar, 'PATCH', '/api/account', { displayName: 'X' })).json()).toEqual(LOCKED);
    expect((await call(jar, 'DELETE', '/api/account')).json()).toEqual(LOCKED);
    expect((await call(jar, 'DELETE', '/api/account/pin')).json()).toEqual(LOCKED);
    expect((await call(jar, 'PUT', '/api/account/pin', { pin: '1111' })).json()).toEqual(LOCKED);

    // … but the child can still learn, set up the microphone and pick a figure
    expect(
      (await call(jar, 'PATCH', `/api/profiles/${kid.id}`, { calibration: { a4Hz: 442 } }))
        .statusCode,
    ).toBe(200);
    const fig = await call(jar, 'PATCH', `/api/profiles/${kid.id}`, { avatar: 'frog' });
    expect(fig.json().avatar).toBe('frog');
    // … and set a goal song (only the title, a style and skills are stored)
    const goalSong = { title: 'Nothing Else Matters', style: 'ballad', skills: ['minor', 'pedal'] };
    const goal = await call(jar, 'PATCH', `/api/profiles/${kid.id}`, { goalSong });
    expect(goal.json().goalSong).toEqual(goalSong);
    expect(
      (
        await call(jar, 'PATCH', `/api/profiles/${kid.id}`, {
          goalSong: { ...goalSong, skills: ['flying'] },
        })
      ).statusCode,
    ).toBe(400);
    expect(
      (await call(jar, 'PATCH', `/api/profiles/${kid.id}`, { goalSong: null })).json().goalSong,
    ).toBeNull();
    expect(
      (
        await call(jar, 'PATCH', `/api/profiles/${kid.id}`, { avatar: 'owl', dailyGoalMinutes: 30 })
      ).json(),
    ).toEqual(LOCKED);
    expect((await call(jar, 'GET', '/api/profiles')).statusCode).toBe(200);

    // wrong PIN, then the right one
    expect((await call(jar, 'POST', '/api/account/pin/verify', { pin: '0000' })).json()).toEqual({
      error: 'PIN_WRONG',
    });
    const ok = await call(jar, 'POST', '/api/account/pin/verify', { pin: '2468' });
    expect(ok.statusCode).toBe(200);
    expect(new Date(ok.json().unlockedUntil).getTime()).toBeGreaterThan(Date.now());
    expect((await call(jar, 'GET', '/api/passkeys')).statusCode).toBe(200);

    // locking explicitly
    await call(jar, 'POST', '/api/account/pin/lock');
    expect((await call(jar, 'GET', '/api/passkeys')).json()).toEqual(LOCKED);
  });

  it('a fresh login opens the parent area (PIN forgotten → log in again, set a new one)', async () => {
    const { jar, kid } = await family();
    await call(jar, 'PUT', '/api/account/pin', { pin: '2468' });
    await call(jar, 'POST', '/api/profiles/select', { profileId: kid.id });

    const again = new CookieJar();
    await call(again, 'POST', '/api/auth/email/request', { email: 'eltern@example.ch' });
    const code = /(\d{6})/.exec(ctx.outbox.at(-1)!.text)![1];
    await call(again, 'POST', '/api/auth/email/verify', { email: 'eltern@example.ch', code });
    expect((await call(again, 'GET', '/api/passkeys')).statusCode).toBe(200);
    expect((await call(again, 'PUT', '/api/account/pin', { pin: '13579' })).statusCode).toBe(204);
  });

  it('validates the PIN format and can be removed', async () => {
    const { jar } = await family();
    for (const pin of ['123', '1234567', 'abcd']) {
      expect((await call(jar, 'PUT', '/api/account/pin', { pin })).statusCode).toBe(400);
    }
    await call(jar, 'PUT', '/api/account/pin', { pin: '2468' });
    expect((await call(jar, 'DELETE', '/api/account/pin')).statusCode).toBe(204);
    expect((await call(jar, 'GET', '/api/auth/me')).json().user.parentPin.set).toBe(false);
  });
});
