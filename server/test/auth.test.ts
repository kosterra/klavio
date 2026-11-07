import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LightMyRequestResponse } from 'fastify';
import { CookieJar, ORIGIN, setupTestApp } from './helpers.js';

// Real authenticators can't run in tests → stub the crypto verification, keep
// everything else (challenge handling, sessions, DB) real.
vi.mock('../src/lib/webauthn.js', () => {
  let n = 0;
  return {
    webauthn: {
      registrationOptions: async () => ({ challenge: `reg-challenge-${++n}` }),
      authenticationOptions: async () => ({ challenge: `auth-challenge-${++n}` }),
      verifyRegistration: async (_c: unknown, response: { id: string }, challenge: string) => {
        if (!challenge.startsWith('reg-')) throw new Error('wrong challenge');
        return {
          credentialId: response.id,
          publicKey: Buffer.from('pk'),
          counter: 0,
          transports: ['internal'],
          deviceType: 'multiDevice',
          backedUp: true,
          providerName: 'Test Keychain',
        };
      },
      verifyAuthentication: async () => ({ newCounter: 1, backedUp: true }),
    },
  };
});

const fakeCredential = (id: string) => ({
  id,
  rawId: id,
  type: 'public-key',
  response: { clientDataJSON: 'x' },
  clientExtensionResults: {},
});

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

async function registerWithPasskey(jar: CookieJar, credentialId = 'cred-1', name = 'Mia') {
  expect(
    (await call(jar, 'POST', '/api/auth/register/options', { displayName: name })).statusCode,
  ).toBe(200);
  const res = await call(jar, 'POST', '/api/auth/register/verify', {
    response: fakeCredential(credentialId),
  });
  expect(res.statusCode).toBe(200);
  return res.json() as { recoveryCodes: string[] };
}

describe('passkey registration & login', () => {
  it('registers, returns recovery codes and creates a session', async () => {
    const jar = new CookieJar();
    const { recoveryCodes } = await registerWithPasskey(jar);
    expect(recoveryCodes).toHaveLength(8);
    expect(recoveryCodes[0]).toMatch(/^[A-Z2-9]{5}-[A-Z2-9]{5}$/);

    const me = await call(jar, 'GET', '/api/auth/me');
    expect(me.statusCode).toBe(200);
    expect(me.json().user).toMatchObject({
      displayName: 'Mia',
      email: null,
      role: 'user',
      recoveryCodesRemaining: 8,
    });
  });

  it('sets hardened cookie flags', async () => {
    const jar = new CookieJar();
    await call(jar, 'POST', '/api/auth/register/options', { displayName: 'Mia' });
    const res = await call(jar, 'POST', '/api/auth/register/verify', {
      response: fakeCredential('c'),
    });
    const sid = res.cookies.find((c) => c.name === 'klavio_sid')!;
    expect(sid).toMatchObject({ httpOnly: true, secure: true, sameSite: 'Lax', path: '/api' });
  });

  it('rejects verify without a challenge and challenge reuse', async () => {
    const jar = new CookieJar();
    const res = await call(jar, 'POST', '/api/auth/register/verify', {
      response: fakeCredential('x'),
    });
    expect(res.json()).toEqual({ error: 'CHALLENGE_MISSING' });

    await call(jar, 'POST', '/api/auth/register/options', { displayName: 'Mia' });
    const cookieHeader = jar.header;
    await call(jar, 'POST', '/api/auth/register/verify', { response: fakeCredential('x') });
    // replay the same challenge cookie
    const replay = await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/register/verify',
      payload: { response: fakeCredential('y') },
      headers: { origin: ORIGIN, cookie: cookieHeader },
    });
    expect(replay.json()).toEqual({ error: 'CHALLENGE_INVALID' });
  });

  it('does not accept a login challenge for registration', async () => {
    const jar = new CookieJar();
    await call(jar, 'POST', '/api/auth/login/options');
    const res = await call(jar, 'POST', '/api/auth/register/verify', {
      response: fakeCredential('x'),
    });
    expect(res.json()).toEqual({ error: 'CHALLENGE_INVALID' });
  });

  it('logs in with a known passkey and logs out', async () => {
    await registerWithPasskey(new CookieJar(), 'cred-login');
    const jar = new CookieJar();
    expect((await call(jar, 'GET', '/api/auth/me')).statusCode).toBe(401);

    await call(jar, 'POST', '/api/auth/login/options');
    const login = await call(jar, 'POST', '/api/auth/login/verify', {
      response: fakeCredential('cred-login'),
    });
    expect(login.statusCode).toBe(200);
    expect((await call(jar, 'GET', '/api/auth/me')).statusCode).toBe(200);

    await call(jar, 'POST', '/api/auth/logout');
    expect((await call(jar, 'GET', '/api/auth/me')).statusCode).toBe(401);
  });

  it('rejects unknown passkeys', async () => {
    const jar = new CookieJar();
    await call(jar, 'POST', '/api/auth/login/options');
    const res = await call(jar, 'POST', '/api/auth/login/verify', {
      response: fakeCredential('nope'),
    });
    expect(res.json()).toEqual({ error: 'PASSKEY_UNKNOWN' });
  });

  it('rejects state-changing requests from foreign origins', async () => {
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/login/options',
      headers: { origin: 'https://evil.example' },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json()).toEqual({ error: 'BAD_ORIGIN' });
  });

  it('validates input', async () => {
    const res = await call(new CookieJar(), 'POST', '/api/auth/register/options', {
      displayName: '',
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('VALIDATION');
  });
});

describe('passkey management', () => {
  it('lists, adds, renames and deletes passkeys but never the last login method', async () => {
    const jar = new CookieJar();
    await registerWithPasskey(jar, 'first');

    let list = (await call(jar, 'GET', '/api/passkeys')).json();
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('Test Keychain');

    expect((await call(jar, 'DELETE', `/api/passkeys/${list[0].id}`)).json()).toEqual({
      error: 'LAST_LOGIN_METHOD',
    });

    await call(jar, 'POST', '/api/passkeys/options');
    expect(
      (await call(jar, 'POST', '/api/passkeys/verify', { response: fakeCredential('second') }))
        .statusCode,
    ).toBe(200);

    list = (await call(jar, 'GET', '/api/passkeys')).json();
    expect(list).toHaveLength(2);

    const renamed = await call(jar, 'PATCH', `/api/passkeys/${list[1].id}`, {
      name: 'iPad Klavier',
    });
    expect(renamed.json().name).toBe('iPad Klavier');

    expect((await call(jar, 'DELETE', `/api/passkeys/${list[0].id}`)).statusCode).toBe(204);
    expect((await call(jar, 'GET', '/api/passkeys')).json()).toHaveLength(1);
  });

  it("cannot touch another account's passkeys", async () => {
    const a = new CookieJar();
    await registerWithPasskey(a, 'a-cred');
    const aKey = (await call(a, 'GET', '/api/passkeys')).json()[0].id;

    const b = new CookieJar();
    await registerWithPasskey(b, 'b-cred', 'Ben');
    expect((await call(b, 'PATCH', `/api/passkeys/${aKey}`, { name: 'hacked' })).statusCode).toBe(
      404,
    );
    expect((await call(b, 'DELETE', `/api/passkeys/${aKey}`)).statusCode).toBe(404);
  });
});

describe('recovery codes', () => {
  it('logs in once per code', async () => {
    const { recoveryCodes } = await registerWithPasskey(new CookieJar());
    const code = recoveryCodes[0]!.toLowerCase(); // input is normalised

    const jar = new CookieJar();
    const ok = await call(jar, 'POST', '/api/auth/recovery', { code });
    expect(ok.json()).toEqual({ ok: true, recoveryCodesRemaining: 7 });
    expect((await call(jar, 'GET', '/api/auth/me')).statusCode).toBe(200);

    const again = await call(new CookieJar(), 'POST', '/api/auth/recovery', { code });
    expect(again.json()).toEqual({ error: 'RECOVERY_CODE_INVALID' });
  });
});

describe('profiles', () => {
  it('creates, selects, updates and deletes profiles scoped to the account', async () => {
    const jar = new CookieJar();
    await registerWithPasskey(jar);

    const created = await call(jar, 'POST', '/api/profiles', { name: 'Lina', avatar: 'owl' });
    expect(created.statusCode).toBe(201);
    const profile = created.json();
    expect(profile).toMatchObject({
      name: 'Lina',
      avatar: 'owl',
      uiMode: 'kids',
      xp: 0,
      calibration: { a4Hz: 440 },
    });

    await call(jar, 'POST', '/api/profiles/select', { profileId: profile.id });
    expect((await call(jar, 'GET', '/api/auth/me')).json().activeProfileId).toBe(profile.id);

    const patched = await call(jar, 'PATCH', `/api/profiles/${profile.id}`, {
      uiMode: 'classic',
      calibration: { a4Hz: 442 },
    });
    expect(patched.json()).toMatchObject({
      uiMode: 'classic',
      calibration: { a4Hz: 442, inputGain: 1 },
    });

    const other = new CookieJar();
    await registerWithPasskey(other, 'other', 'Ben');
    expect(
      (await call(other, 'POST', '/api/profiles/select', { profileId: profile.id })).statusCode,
    ).toBe(404);

    expect((await call(jar, 'DELETE', `/api/profiles/${profile.id}`)).statusCode).toBe(204);
    expect((await call(jar, 'GET', '/api/auth/me')).json().activeProfileId).toBeNull();
  });

  it('rejects calibration outside the plausible range', async () => {
    const jar = new CookieJar();
    await registerWithPasskey(jar);
    const p = (await call(jar, 'POST', '/api/profiles', { name: 'X' })).json();
    expect(
      (await call(jar, 'PATCH', `/api/profiles/${p.id}`, { calibration: { a4Hz: 500 } }))
        .statusCode,
    ).toBe(400);
  });
});

describe('e-mail login and admin switch', () => {
  async function makeAdmin(jar: CookieJar) {
    await registerWithPasskey(jar, 'admin-cred', 'Admin');
    const { User } = await import('../src/models/index.js');
    await User.updateOne({ displayName: 'Admin' }, { role: 'admin' });
  }

  it('is disabled by default and only admins may enable it', async () => {
    const anon = new CookieJar();
    expect((await call(anon, 'GET', '/api/config')).json().emailLoginEnabled).toBe(false);
    expect(
      (await call(anon, 'POST', '/api/auth/email/request', { email: 'a@b.ch' })).json(),
    ).toEqual({
      error: 'EMAIL_LOGIN_DISABLED',
    });

    const user = new CookieJar();
    await registerWithPasskey(user, 'u');
    expect(
      (await call(user, 'PUT', '/api/admin/settings', { emailLoginEnabled: true })).statusCode,
    ).toBe(403);

    const admin = new CookieJar();
    await makeAdmin(admin);
    const res = await call(admin, 'PUT', '/api/admin/settings', { emailLoginEnabled: true });
    expect(res.json()).toEqual({ emailLoginEnabled: true });
    expect((await call(anon, 'GET', '/api/config')).json().emailLoginEnabled).toBe(true);
  });

  async function enableEmailLogin() {
    const admin = new CookieJar();
    await makeAdmin(admin);
    await call(admin, 'PUT', '/api/admin/settings', { emailLoginEnabled: true });
  }

  const codeFrom = (text: string) => /(\d{6})/.exec(text)![1]!;

  it('signs up via e-mail code (asking for a name first) and logs in again', async () => {
    await enableEmailLogin();
    const jar = new CookieJar();
    expect(
      (await call(jar, 'POST', '/api/auth/email/request', { email: 'Eva@Example.ch ' })).statusCode,
    ).toBe(204);
    expect(ctx.outbox.at(-1)!.to).toBe('eva@example.ch');
    const code = codeFrom(ctx.outbox.at(-1)!.text);

    const first = await call(jar, 'POST', '/api/auth/email/verify', {
      email: 'eva@example.ch',
      code,
    });
    expect(first.json()).toEqual({ status: 'needs-display-name' });
    const created = await call(jar, 'POST', '/api/auth/email/verify', {
      email: 'eva@example.ch',
      code,
      displayName: 'Eva',
    });
    expect(created.json()).toMatchObject({ status: 'created' });
    expect((await call(jar, 'GET', '/api/auth/me')).json().user).toMatchObject({
      displayName: 'Eva',
      email: 'eva@example.ch',
    });

    // code is single-use
    const reuse = await call(new CookieJar(), 'POST', '/api/auth/email/verify', {
      email: 'eva@example.ch',
      code,
    });
    expect(reuse.json()).toEqual({ error: 'EMAIL_CODE_INVALID' });

    const again = new CookieJar();
    await call(again, 'POST', '/api/auth/email/request', { email: 'eva@example.ch' });
    const code2 = codeFrom(ctx.outbox.at(-1)!.text);
    expect(
      (
        await call(again, 'POST', '/api/auth/email/verify', {
          email: 'eva@example.ch',
          code: code2,
        })
      ).json(),
    ).toEqual({
      status: 'ok',
    });
  });

  it('burns a code after 5 wrong attempts', async () => {
    await enableEmailLogin();
    const jar = new CookieJar();
    await call(jar, 'POST', '/api/auth/email/request', { email: 'x@y.ch' });
    const code = codeFrom(ctx.outbox.at(-1)!.text);
    const wrong = code === '000000' ? '111111' : '000000';
    for (let i = 0; i < 5; i++) {
      await call(jar, 'POST', '/api/auth/email/verify', {
        email: 'x@y.ch',
        code: wrong,
        displayName: 'X',
      });
    }
    const res = await call(jar, 'POST', '/api/auth/email/verify', {
      email: 'x@y.ch',
      code,
      displayName: 'X',
    });
    expect(res.json()).toEqual({ error: 'EMAIL_CODE_INVALID' });
  });

  it('throttles silently after 3 active codes', async () => {
    await enableEmailLogin();
    const jar = new CookieJar();
    for (let i = 0; i < 4; i++) {
      expect(
        (await call(jar, 'POST', '/api/auth/email/request', { email: 'z@y.ch' })).statusCode,
      ).toBe(204);
    }
    expect(ctx.outbox.filter((m) => m.to === 'z@y.ch')).toHaveLength(3);
  });

  it('attaches a verified e-mail to a passkey account; then the last passkey may be removed', async () => {
    await enableEmailLogin();
    const jar = new CookieJar();
    await registerWithPasskey(jar, 'p1', 'Paul');
    await call(jar, 'POST', '/api/account/email/request', { email: 'paul@example.ch' });
    const code = codeFrom(ctx.outbox.at(-1)!.text);
    expect((await call(jar, 'POST', '/api/account/email/verify', { code })).json()).toEqual({
      email: 'paul@example.ch',
    });

    const key = (await call(jar, 'GET', '/api/passkeys')).json()[0].id;
    expect((await call(jar, 'DELETE', `/api/passkeys/${key}`)).statusCode).toBe(204);
    // …but now the e-mail can't be removed (it's the only way in)
    expect((await call(jar, 'DELETE', '/api/account/email')).json()).toEqual({
      error: 'LAST_LOGIN_METHOD',
    });
  });
});

describe('account deletion', () => {
  it('removes the account with all its data', async () => {
    const jar = new CookieJar();
    await registerWithPasskey(jar);
    await call(jar, 'POST', '/api/profiles', { name: 'Lina' });
    expect((await call(jar, 'DELETE', '/api/account')).statusCode).toBe(204);
    expect((await call(jar, 'GET', '/api/auth/me')).statusCode).toBe(401);
    const { Profile, Passkey } = await import('../src/models/index.js');
    expect(await Profile.countDocuments()).toBe(0);
    expect(await Passkey.countDocuments()).toBe(0);
  });
});
