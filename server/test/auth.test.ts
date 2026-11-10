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

const codeFrom = (text: string) => /(\d{6})/.exec(text)![1]!;
const lastCode = () => codeFrom(ctx.outbox.at(-1)!.text);

/** Sign up via e-mail code; leaves `jar` logged in. */
async function signUp(jar: CookieJar, email = 'mia@example.ch', name = 'Mia') {
  expect((await call(jar, 'POST', '/api/auth/email/request', { email })).statusCode).toBe(204);
  const res = await call(jar, 'POST', '/api/auth/email/verify', {
    email,
    code: lastCode(),
    displayName: name,
  });
  expect(res.json()).toEqual({ status: 'created' });
  return res;
}

async function addPasskey(jar: CookieJar, credentialId: string) {
  expect((await call(jar, 'POST', '/api/passkeys/options')).statusCode).toBe(200);
  const res = await call(jar, 'POST', '/api/passkeys/verify', {
    response: fakeCredential(credentialId),
  });
  expect(res.statusCode).toBe(200);
  return res.json() as { id: string; name: string };
}

async function makeAdmin(jar: CookieJar) {
  await signUp(jar, 'admin@example.ch', 'Admin');
  const { User } = await import('../src/models/index.js');
  await User.updateOne({ email: 'admin@example.ch' }, { role: 'admin' });
}

describe('sign-up via e-mail code', () => {
  it('asks for a name first, creates the account and a session', async () => {
    const jar = new CookieJar();
    expect(
      (await call(jar, 'POST', '/api/auth/email/request', { email: 'Eva@Example.ch ' })).statusCode,
    ).toBe(204);
    expect(ctx.outbox.at(-1)!.to).toBe('eva@example.ch');
    const code = lastCode();

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
    expect(created.json()).toEqual({ status: 'created' });

    const sid = created.cookies.find((c) => c.name === 'klavio_sid')!;
    expect(sid).toMatchObject({ httpOnly: true, secure: true, sameSite: 'Lax', path: '/api' });

    expect((await call(jar, 'GET', '/api/auth/me')).json().user).toMatchObject({
      displayName: 'Eva',
      email: 'eva@example.ch',
      role: 'user',
      passkeyCount: 0,
    });
  });

  it('logs in again with a new code; codes are single-use', async () => {
    const jar = new CookieJar();
    await signUp(jar);
    const used = lastCode();

    const reuse = await call(new CookieJar(), 'POST', '/api/auth/email/verify', {
      email: 'mia@example.ch',
      code: used,
    });
    expect(reuse.json()).toEqual({ error: 'EMAIL_CODE_INVALID' });

    const again = new CookieJar();
    await call(again, 'POST', '/api/auth/email/request', { email: 'mia@example.ch' });
    expect(
      (
        await call(again, 'POST', '/api/auth/email/verify', {
          email: 'mia@example.ch',
          code: lastCode(),
        })
      ).json(),
    ).toEqual({ status: 'ok' });
    expect((await call(again, 'GET', '/api/auth/me')).statusCode).toBe(200);
  });

  it('burns a code after 5 wrong attempts', async () => {
    const jar = new CookieJar();
    await call(jar, 'POST', '/api/auth/email/request', { email: 'x@y.ch' });
    const code = lastCode();
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

  it('counts parallel guesses atomically – never more than 5 per code', async () => {
    const jar = new CookieJar();
    await call(jar, 'POST', '/api/auth/email/request', { email: 'p@y.ch' });
    const code = lastCode();
    const wrong = (i: number) => String((Number(code) + 1 + i) % 1_000_000).padStart(6, '0');
    await Promise.all(
      Array.from({ length: 12 }, (_, i) =>
        call(new CookieJar(), 'POST', '/api/auth/email/verify', {
          email: 'p@y.ch',
          code: wrong(i),
        }),
      ),
    );
    const { EmailCode } = await import('../src/models/index.js');
    expect((await EmailCode.findOne({ email: 'p@y.ch' }).lean())!.attempts).toBe(5);
    // the right code no longer works – and 12 failures have locked the address
    expect(
      (await call(jar, 'POST', '/api/auth/email/verify', { email: 'p@y.ch', code })).json(),
    ).toEqual({ error: 'RATE_LIMITED' });
  });

  it('locks an address after 10 wrong codes, whatever the IP (also for the right code)', async () => {
    const jar = new CookieJar();
    const wrongFor = (c: string) => (c === '000000' ? '111111' : '000000');
    for (let round = 0; round < 2; round++) {
      await call(jar, 'POST', '/api/auth/email/request', { email: 'q@y.ch' });
      const c = lastCode();
      for (let i = 0; i < 5; i++) {
        await call(jar, 'POST', '/api/auth/email/verify', { email: 'q@y.ch', code: wrongFor(c) });
      }
    }
    await call(jar, 'POST', '/api/auth/email/request', { email: 'q@y.ch' });
    const res = await call(jar, 'POST', '/api/auth/email/verify', {
      email: 'q@y.ch',
      code: lastCode(),
      displayName: 'Q',
    });
    expect(res.statusCode).toBe(429);
    expect(res.json()).toEqual({ error: 'RATE_LIMITED' });
  });

  it('throttles silently after 3 active codes', async () => {
    const jar = new CookieJar();
    for (let i = 0; i < 4; i++) {
      expect(
        (await call(jar, 'POST', '/api/auth/email/request', { email: 'z@y.ch' })).statusCode,
      ).toBe(204);
    }
    expect(ctx.outbox.filter((m) => m.to === 'z@y.ch')).toHaveLength(3);
  });

  it('validates input', async () => {
    const jar = new CookieJar();
    await call(jar, 'POST', '/api/auth/email/request', { email: 'v@y.ch' });
    const res = await call(jar, 'POST', '/api/auth/email/verify', {
      email: 'v@y.ch',
      code: lastCode(),
      displayName: '',
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('VALIDATION');
    expect(
      (await call(jar, 'POST', '/api/auth/email/request', { email: 'not-an-email' })).statusCode,
    ).toBe(400);
  });

  it('rejects state-changing requests from foreign origins', async () => {
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/email/request',
      payload: { email: 'a@b.ch' },
      headers: { origin: 'https://evil.example' },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json()).toEqual({ error: 'BAD_ORIGIN' });
  });

  it('no longer offers passkey-first registration or recovery codes', async () => {
    const jar = new CookieJar();
    for (const url of ['/api/auth/register/options', '/api/auth/recovery']) {
      expect((await call(jar, 'POST', url, {})).statusCode).toBe(404);
    }
  });
});

describe('admin switch: registration open/closed', () => {
  it('is open by default; only admins may close it', async () => {
    const anon = new CookieJar();
    expect((await call(anon, 'GET', '/api/config')).json().registrationOpen).toBe(true);

    const user = new CookieJar();
    await signUp(user, 'u@example.ch', 'User');
    expect(
      (await call(user, 'PUT', '/api/admin/settings', { registrationOpen: false })).statusCode,
    ).toBe(403);

    const admin = new CookieJar();
    await makeAdmin(admin);
    const res = await call(admin, 'PUT', '/api/admin/settings', { registrationOpen: false });
    expect(res.json()).toMatchObject({ registrationOpen: false });
    expect((await call(anon, 'GET', '/api/config')).json().registrationOpen).toBe(false);
  });

  it('when closed: no new accounts, but existing accounts can still log in', async () => {
    const existing = new CookieJar();
    await signUp(existing, 'old@example.ch', 'Old');
    const admin = new CookieJar();
    await makeAdmin(admin);

    // A code requested while registration was still open …
    const late = new CookieJar();
    await call(late, 'POST', '/api/auth/email/request', { email: 'late@example.ch' });
    const lateCode = lastCode();

    await call(admin, 'PUT', '/api/admin/settings', { registrationOpen: false });
    ctx.outbox.length = 0;

    // … can no longer create an account.
    const refused = await call(late, 'POST', '/api/auth/email/verify', {
      email: 'late@example.ch',
      code: lateCode,
      displayName: 'Late',
    });
    expect(refused.statusCode).toBe(403);
    expect(refused.json()).toEqual({ error: 'REGISTRATION_CLOSED' });

    // Unknown address: still 204 (no enumeration), but no mail is sent, and a
    // guessed code gets the same answer as for an existing account.
    const anon = new CookieJar();
    expect(
      (await call(anon, 'POST', '/api/auth/email/request', { email: 'new@example.ch' })).statusCode,
    ).toBe(204);
    expect(ctx.outbox).toHaveLength(0);
    for (const email of ['new@example.ch', 'old@example.ch']) {
      const guess = await call(anon, 'POST', '/api/auth/email/verify', {
        email,
        code: '123456',
        displayName: 'New',
      });
      expect(guess.json()).toEqual({ error: 'EMAIL_CODE_INVALID' });
    }

    const again = new CookieJar();
    await call(again, 'POST', '/api/auth/email/request', { email: 'old@example.ch' });
    expect(
      (
        await call(again, 'POST', '/api/auth/email/verify', {
          email: 'old@example.ch',
          code: lastCode(),
        })
      ).json(),
    ).toEqual({ status: 'ok' });
  });
});

describe('passkeys (added after sign-up)', () => {
  it('adds a passkey in the account and logs in with it', async () => {
    const jar = new CookieJar();
    await signUp(jar);
    const key = await addPasskey(jar, 'cred-login');
    expect(key.name).toBe('Test Keychain');
    expect((await call(jar, 'GET', '/api/auth/me')).json().user.passkeyCount).toBe(1);

    const fresh = new CookieJar();
    expect((await call(fresh, 'GET', '/api/auth/me')).statusCode).toBe(401);
    await call(fresh, 'POST', '/api/auth/login/options');
    const login = await call(fresh, 'POST', '/api/auth/login/verify', {
      response: fakeCredential('cred-login'),
    });
    expect(login.statusCode).toBe(200);
    expect((await call(fresh, 'GET', '/api/auth/me')).json().user.email).toBe('mia@example.ch');

    await call(fresh, 'POST', '/api/auth/logout');
    expect((await call(fresh, 'GET', '/api/auth/me')).statusCode).toBe(401);
  });

  it('requires a session to add passkeys', async () => {
    expect((await call(new CookieJar(), 'POST', '/api/passkeys/options')).statusCode).toBe(401);
  });

  it('rejects unknown passkeys', async () => {
    const jar = new CookieJar();
    await call(jar, 'POST', '/api/auth/login/options');
    const res = await call(jar, 'POST', '/api/auth/login/verify', {
      response: fakeCredential('nope'),
    });
    expect(res.json()).toEqual({ error: 'PASSKEY_UNKNOWN' });
  });

  it('rejects verify without a challenge, challenge reuse and wrong purpose', async () => {
    const jar = new CookieJar();
    await signUp(jar);
    expect(
      (await call(jar, 'POST', '/api/passkeys/verify', { response: fakeCredential('x') })).json(),
    ).toEqual({ error: 'CHALLENGE_MISSING' });

    await call(jar, 'POST', '/api/passkeys/options');
    const cookieHeader = jar.header;
    await call(jar, 'POST', '/api/passkeys/verify', { response: fakeCredential('x') });
    const replay = await ctx.app.inject({
      method: 'POST',
      url: '/api/passkeys/verify',
      payload: { response: fakeCredential('y') },
      headers: { origin: ORIGIN, cookie: cookieHeader },
    });
    expect(replay.json()).toEqual({ error: 'CHALLENGE_INVALID' });

    await call(jar, 'POST', '/api/auth/login/options');
    expect(
      (await call(jar, 'POST', '/api/passkeys/verify', { response: fakeCredential('z') })).json(),
    ).toEqual({ error: 'CHALLENGE_INVALID' });
  });

  it('lists, renames and deletes passkeys, including the last one', async () => {
    const jar = new CookieJar();
    await signUp(jar);
    await addPasskey(jar, 'first');
    await addPasskey(jar, 'second');

    let list = (await call(jar, 'GET', '/api/passkeys')).json();
    expect(list).toHaveLength(2);

    const renamed = await call(jar, 'PATCH', `/api/passkeys/${list[1].id}`, {
      name: 'iPad Klavier',
    });
    expect(renamed.json().name).toBe('iPad Klavier');

    for (const k of list) {
      expect((await call(jar, 'DELETE', `/api/passkeys/${k.id}`)).statusCode).toBe(204);
    }
    list = (await call(jar, 'GET', '/api/passkeys')).json();
    expect(list).toHaveLength(0);
  });

  it('refuses a credential that is already registered', async () => {
    const jar = new CookieJar();
    await signUp(jar);
    await addPasskey(jar, 'dup');
    await call(jar, 'POST', '/api/passkeys/options');
    expect(
      (await call(jar, 'POST', '/api/passkeys/verify', { response: fakeCredential('dup') })).json(),
    ).toEqual({ error: 'PASSKEY_ALREADY_REGISTERED' });
  });

  it("cannot touch another account's passkeys", async () => {
    const a = new CookieJar();
    await signUp(a, 'a@example.ch', 'A');
    const aKey = (await addPasskey(a, 'a-cred')).id;

    const b = new CookieJar();
    await signUp(b, 'b@example.ch', 'Ben');
    expect((await call(b, 'PATCH', `/api/passkeys/${aKey}`, { name: 'hacked' })).statusCode).toBe(
      404,
    );
    expect((await call(b, 'DELETE', `/api/passkeys/${aKey}`)).statusCode).toBe(404);
  });
});

describe('account name', () => {
  it('can be changed and is validated', async () => {
    const jar = new CookieJar();
    await signUp(jar);
    const res = await call(jar, 'PATCH', '/api/account', { displayName: '  Familie Huber ' });
    expect(res.json()).toEqual({ displayName: 'Familie Huber' });
    expect((await call(jar, 'GET', '/api/auth/me')).json().user.displayName).toBe('Familie Huber');
    expect((await call(jar, 'PATCH', '/api/account', { displayName: '' })).statusCode).toBe(400);
    expect(
      (await call(new CookieJar(), 'PATCH', '/api/account', { displayName: 'X' })).statusCode,
    ).toBe(401);
  });
});

describe('changing the e-mail address', () => {
  it('verifies the new address with a code', async () => {
    const jar = new CookieJar();
    await signUp(jar, 'paul@example.ch', 'Paul');
    await call(jar, 'POST', '/api/account/email/request', { email: 'paul@neu.ch' });
    expect(ctx.outbox.at(-1)!.to).toBe('paul@neu.ch');
    expect(
      (await call(jar, 'POST', '/api/account/email/verify', { code: lastCode() })).json(),
    ).toEqual({ email: 'paul@neu.ch' });
    expect((await call(jar, 'GET', '/api/auth/me')).json().user.email).toBe('paul@neu.ch');
  });

  it('refuses an address used by another account; the address cannot be removed', async () => {
    await signUp(new CookieJar(), 'taken@example.ch', 'T');
    const jar = new CookieJar();
    await signUp(jar);
    expect(
      (await call(jar, 'POST', '/api/account/email/request', { email: 'taken@example.ch' })).json(),
    ).toEqual({ error: 'EMAIL_IN_USE' });
    expect((await call(jar, 'DELETE', '/api/account/email')).statusCode).toBe(404);
  });
});

describe('profiles', () => {
  it('creates, selects, updates and deletes profiles scoped to the account', async () => {
    const jar = new CookieJar();
    await signUp(jar);

    const created = await call(jar, 'POST', '/api/profiles', {
      name: 'Lina',
      avatar: 'owl',
      birthYear: 2016,
    });
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
    await signUp(other, 'ben@example.ch', 'Ben');
    expect(
      (await call(other, 'POST', '/api/profiles/select', { profileId: profile.id })).statusCode,
    ).toBe(404);

    expect((await call(jar, 'DELETE', `/api/profiles/${profile.id}`)).statusCode).toBe(204);
    expect((await call(jar, 'GET', '/api/auth/me')).json().activeProfileId).toBeNull();
  });

  it('rejects calibration outside the plausible range', async () => {
    const jar = new CookieJar();
    await signUp(jar);
    const p = (await call(jar, 'POST', '/api/profiles', { name: 'X', birthYear: 2016 })).json();
    expect(
      (await call(jar, 'PATCH', `/api/profiles/${p.id}`, { calibration: { a4Hz: 500 } }))
        .statusCode,
    ).toBe(400);
  });
});

describe('account deletion', () => {
  it('removes the account with all its data', async () => {
    const jar = new CookieJar();
    await signUp(jar);
    await addPasskey(jar, 'del');
    await call(jar, 'POST', '/api/profiles', { name: 'Lina', birthYear: 2016 });
    expect((await call(jar, 'DELETE', '/api/account')).statusCode).toBe(204);
    expect((await call(jar, 'GET', '/api/auth/me')).statusCode).toBe(401);
    const { Profile, Passkey, User } = await import('../src/models/index.js');
    expect(await Profile.countDocuments()).toBe(0);
    expect(await Passkey.countDocuments()).toBe(0);
    expect(await User.countDocuments()).toBe(0);
  });
});
