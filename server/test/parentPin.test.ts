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

  it('a new profile answers its start-up questions and may place itself – once', async () => {
    const { jar, kid } = await family();
    expect(kid.setupDone).toBe(false);
    await call(jar, 'PUT', '/api/account/pin', { pin: '2468' });
    await call(jar, 'POST', '/api/profiles/select', { profileId: kid.id });

    // locked parent area, but a fresh profile without progress: allowed
    expect(
      (await call(jar, 'POST', '/api/progress/placement', { chapterId: 'songs' })).json().placed,
    ).toBeGreaterThan(0);
    // the answer got lost and the questions are sent again: still allowed (nothing played yet)
    expect(
      (await call(jar, 'POST', '/api/progress/placement', { chapterId: 'songs' })).statusCode,
    ).toBe(200);
    const done = await call(jar, 'PATCH', `/api/profiles/${kid.id}`, {
      setupDone: true,
      motive: 'fun',
      weeklyGoalDays: 4,
      playOn: 'screen',
    });
    expect(done.json()).toMatchObject({
      setupDone: true,
      motive: 'fun',
      weeklyGoalDays: 4,
      playOn: 'screen',
    });
    // where to play is the learner's own choice, also with the parent area locked
    const piano = await call(jar, 'PATCH', `/api/profiles/${kid.id}`, { playOn: 'piano' });
    expect(piano.json().playOn).toBe('piano');

    // afterwards placement is parent area again
    expect(
      (await call(jar, 'POST', '/api/progress/placement', { chapterId: 'both' })).json(),
    ).toEqual(LOCKED);
    const progress = (await call(jar, 'GET', '/api/progress?date=2026-11-09')).json();
    expect(progress.weekDays).toEqual([]);
  });

  it('a fresh login keeps the parent area locked; a forgotten PIN is reset by e-mail', async () => {
    const { jar, kid } = await family();
    await call(jar, 'PUT', '/api/account/pin', { pin: '2468' });
    await call(jar, 'POST', '/api/profiles/select', { profileId: kid.id });

    // logging out and in again does not get round the PIN
    const again = new CookieJar();
    await call(again, 'POST', '/api/auth/email/request', { email: 'eltern@example.ch' });
    const login = /(\d{6})/.exec(ctx.outbox.at(-1)!.text)![1];
    await call(again, 'POST', '/api/auth/email/verify', {
      email: 'eltern@example.ch',
      code: login,
    });
    expect((await call(again, 'GET', '/api/passkeys')).json()).toEqual(LOCKED);

    // «PIN vergessen?»: a code to the account's address removes it and opens the area
    expect((await call(again, 'POST', '/api/account/pin/reset/request')).statusCode).toBe(204);
    expect(ctx.outbox.at(-1)!.to).toBe('eltern@example.ch');
    const reset = /(\d{6})/.exec(ctx.outbox.at(-1)!.text)![1];
    // a login code is no reset code
    expect(
      (await call(again, 'POST', '/api/account/pin/reset/verify', { code: login })).statusCode,
    ).toBe(400);
    expect(
      (await call(again, 'POST', '/api/account/pin/reset/verify', { code: reset })).statusCode,
    ).toBe(204);
    expect((await call(again, 'GET', '/api/auth/me')).json().user.parentPin.set).toBe(false);
    expect((await call(again, 'GET', '/api/passkeys')).statusCode).toBe(200);
    expect((await call(again, 'PUT', '/api/account/pin', { pin: '13579' })).statusCode).toBe(204);
  });

  it("a learner changes their own figure, a sibling's only with the parent area", async () => {
    const { jar, kid } = await family();
    const sibling = (
      await call(jar, 'POST', '/api/profiles', { name: 'Ben', birthYear: 2018 })
    ).json();
    await call(jar, 'PUT', '/api/account/pin', { pin: '2468' });
    await call(jar, 'POST', '/api/profiles/select', { profileId: kid.id });
    expect(
      (await call(jar, 'PATCH', `/api/profiles/${kid.id}`, { avatar: 'fox' })).statusCode,
    ).toBe(200);
    expect(
      (await call(jar, 'PATCH', `/api/profiles/${sibling.id}`, { avatar: 'fox' })).json(),
    ).toEqual(LOCKED);
    // siblings' progress stays visible (family overview)
    expect((await call(jar, 'GET', '/api/profiles/overview?date=2026-11-10')).statusCode).toBe(200);
  });

  it('a code request alone does not change the language of the account’s mails', async () => {
    await family();
    await call(new CookieJar(), 'POST', '/api/auth/email/request', {
      email: 'eltern@example.ch',
      lang: 'en',
    });
    const { User } = await import('../src/models/index.js');
    expect((await User.findOne({ email: 'eltern@example.ch' }).lean())!.locale).not.toBe('en');
  });

  it('locks the PIN after five wrong tries – also across restarts (kept in the database)', async () => {
    const { jar, kid } = await family();
    await call(jar, 'PUT', '/api/account/pin', { pin: '2468' });
    await call(jar, 'POST', '/api/profiles/select', { profileId: kid.id });
    for (let i = 0; i < 5; i++) {
      expect((await call(jar, 'POST', '/api/account/pin/verify', { pin: '1111' })).statusCode).toBe(
        403,
      );
    }
    // (the quick in-memory limit is off in tests – this is the lock kept in the database)
    expect((await call(jar, 'POST', '/api/account/pin/verify', { pin: '2468' })).statusCode).toBe(
      429,
    );
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
