import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LightMyRequestResponse } from 'fastify';
import { CookieJar, ORIGIN, setupTestApp } from './helpers.js';

// Real authenticators can't run in tests → stub the crypto, keep challenges, sessions and DB real.
const verifyAuthentication = vi.fn(async () => ({ newCounter: 1, backedUp: true }));
vi.mock('../src/lib/webauthn.js', () => {
  let n = 0;
  return {
    webauthn: {
      registrationOptions: async () => ({ challenge: `reg-challenge-${++n}` }),
      authenticationOptions: async (_c: unknown, only?: { credentialId: string }[]) => ({
        challenge: `auth-challenge-${++n}`,
        allowCredentials: only?.map((c) => ({ id: c.credentialId })),
      }),
      verifyRegistration: async (_c: unknown, response: { id: string }) => ({
        credentialId: response.id,
        publicKey: Buffer.from('pk'),
        counter: 0,
        transports: ['internal'],
        deviceType: 'multiDevice',
        backedUp: true,
      }),
      verifyAuthentication: (...args: unknown[]) =>
        (verifyAuthentication as (...a: unknown[]) => Promise<unknown>)(...args),
    },
  };
});

const credential = (id: string) => ({
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
beforeEach(async () => {
  await ctx.reset();
  verifyAuthentication.mockClear();
});

async function call(
  jar: CookieJar,
  method: 'GET' | 'POST' | 'PUT',
  url: string,
  payload?: unknown,
) {
  const res: LightMyRequestResponse = await ctx.app.inject({
    method,
    url,
    payload: payload as object,
    headers: { origin: ORIGIN, cookie: jar.header },
  });
  jar.store(res);
  return res;
}

/** An account with a passkey and a parent PIN; the parent area is locked again. */
async function parentWithPasskey(email: string, credentialId: string) {
  const jar = new CookieJar();
  await call(jar, 'POST', '/api/auth/email/request', { email });
  const code = /(\d{6})/.exec(ctx.outbox.at(-1)!.text)![1];
  await call(jar, 'POST', '/api/auth/email/verify', { email, code, displayName: 'Familie' });
  await call(jar, 'POST', '/api/passkeys/options');
  await call(jar, 'POST', '/api/passkeys/verify', { response: credential(credentialId) });
  expect((await call(jar, 'PUT', '/api/account/pin', { pin: '1234' })).statusCode).toBe(204);
  return jar;
}

const lock = (jar: CookieJar) => call(jar, 'POST', '/api/account/pin/lock');
const me = async (jar: CookieJar) => (await call(jar, 'GET', '/api/auth/me')).json().user;

describe('opening the parent area with a passkey', () => {
  it('is off until a parent switches it on', async () => {
    const jar = await parentWithPasskey('a@example.ch', 'cred-a');
    expect((await me(jar)).parentPin).toMatchObject({ passkey: false, passkeyEnabled: false });
    await lock(jar);
    const res = await call(jar, 'POST', '/api/account/pin/passkey/options');
    expect(res.statusCode).toBe(403);
    // and switching it on is parent area itself
    expect((await call(jar, 'PUT', '/api/account/pin/passkey', { enabled: true })).statusCode).toBe(
      403,
    );
  });

  it('opens with the account’s own passkey, checking who is at the device', async () => {
    const jar = await parentWithPasskey('b@example.ch', 'cred-b');
    expect((await call(jar, 'PUT', '/api/account/pin/passkey', { enabled: true })).statusCode).toBe(
      204,
    );
    expect((await me(jar)).parentPin).toMatchObject({ passkey: true, passkeyEnabled: true });
    await lock(jar);
    expect((await me(jar)).parentPin.unlockedUntil).toBeNull();

    const options = (await call(jar, 'POST', '/api/account/pin/passkey/options')).json();
    expect(options.allowCredentials).toEqual([{ id: 'cred-b' }]);
    const res = await call(jar, 'POST', '/api/account/pin/passkey/verify', {
      response: credential('cred-b'),
    });
    expect(res.statusCode).toBe(200);
    expect((await me(jar)).parentPin.unlockedUntil).not.toBeNull();
    // user verification required (fingerprint, face or device PIN)
    expect(verifyAuthentication.mock.calls[0]).toContain(true);
  });

  it('refuses a passkey of another account', async () => {
    await parentWithPasskey('other@example.ch', 'cred-other');
    const jar = await parentWithPasskey('c@example.ch', 'cred-c');
    await call(jar, 'PUT', '/api/account/pin/passkey', { enabled: true });
    await lock(jar);
    await call(jar, 'POST', '/api/account/pin/passkey/options');
    const res = await call(jar, 'POST', '/api/account/pin/passkey/verify', {
      response: credential('cred-other'),
    });
    expect(res.statusCode).toBe(403);
    expect((await me(jar)).parentPin.unlockedUntil).toBeNull();
  });
});
