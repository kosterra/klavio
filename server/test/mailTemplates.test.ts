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
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
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

const texts = (subject: string) => ({
  de: { subject, heading: 'Hallo <Familie>', intro: 'Dein Code:', outro: 'Bis bald!' },
  en: { subject: 'EN {{code}}', heading: 'Hi', intro: 'Your code:', outro: 'See you!' },
});

describe('code mails', () => {
  it('are sent in Klavio design, in the language of the app', async () => {
    const jar = new CookieJar();
    await call(jar, 'POST', '/api/auth/email/request', { email: 'eva@example.ch', lang: 'en' });
    const mail = ctx.outbox.at(-1)!;
    expect(mail.subject).toMatch(/^\d{6} is your Klavio code$/);
    expect(mail.html).toContain('<html lang="en">');
    expect(mail.html).toContain(ORIGIN);

    await call(jar, 'POST', '/api/auth/email/request', { email: 'eva@example.ch' });
    expect(ctx.outbox.at(-1)!.subject).toMatch(/^\d{6} ist dein Klavio-Code$/);
  });
});

describe('admin: mail texts', () => {
  it('lists, saves, uses, tests and resets the texts', async () => {
    const admin = new CookieJar();
    await signUp(admin, 'admin@example.ch', 'admin');

    const list = await call(admin, 'GET', '/api/admin/mail-templates');
    expect(list.statusCode).toBe(200);
    expect(list.json().map((t: { id: string }) => t.id)).toEqual([
      'login-code',
      'verify-email',
      'pin-reset',
      'inactive-warning',
      'weekly-report',
    ]);
    expect(list.json()[0].customized).toBe(false);

    const saved = await call(
      admin,
      'PUT',
      '/api/admin/mail-templates/login-code',
      texts('Code {{code}} für {{app}}'),
    );
    expect(saved.statusCode).toBe(200);
    expect(saved.json()).toMatchObject({ customized: true, texts: { de: { outro: 'Bis bald!' } } });

    // the next login mail uses the new texts – escaped in the HTML
    await call(new CookieJar(), 'POST', '/api/auth/email/request', { email: 'mia@example.ch' });
    const mail = ctx.outbox.at(-1)!;
    expect(mail.subject).toMatch(/^Code \d{6} für Klavio$/);
    expect(mail.html).toContain('Hallo &lt;Familie&gt;');

    // a test mail with a sample code goes to the admin
    const test = await call(admin, 'POST', '/api/admin/mail-templates/login-code/test', {
      lang: 'en',
    });
    expect(test.statusCode).toBe(204);
    expect(ctx.outbox.at(-1)).toMatchObject({ to: 'admin@example.ch', subject: 'EN 123456' });

    const reset = await call(admin, 'DELETE', '/api/admin/mail-templates/login-code');
    expect(reset.json().customized).toBe(false);
    expect(reset.json().texts.de.subject).toBe('{{code}} ist dein {{app}}-Code');
  });

  it('rejects empty subjects and unknown mails', async () => {
    const admin = new CookieJar();
    await signUp(admin, 'admin@example.ch', 'admin');
    expect(
      (await call(admin, 'PUT', '/api/admin/mail-templates/login-code', texts(' '))).statusCode,
    ).toBe(400);
    expect(
      (await call(admin, 'PUT', '/api/admin/mail-templates/nope', texts('{{code}}'))).statusCode,
    ).toBe(400);
  });

  it('is only for admins', async () => {
    const user = new CookieJar();
    await signUp(user, 'user@example.ch');
    expect((await call(user, 'GET', '/api/admin/mail-templates')).statusCode).toBe(403);
    expect(
      (await call(user, 'PUT', '/api/admin/mail-templates/login-code', texts('{{code}}')))
        .statusCode,
    ).toBe(403);
  });
});

describe('operator info', () => {
  it('admins set name and contact; everyone sees them in the public config', async () => {
    const admin = new CookieJar();
    await signUp(admin, 'admin@example.ch', 'admin');
    const res = await call(admin, 'PUT', '/api/admin/settings', {
      operatorName: 'Familie Muster',
      contactEmail: 'Kontakt@Example.ch',
    });
    expect(res.json()).toEqual({
      registrationOpen: true,
      publicPage: false, // by default visitors get only the login
      pieceLibrary: false, // the MuseTrainer library is off until an admin switches it on
      operatorName: 'Familie Muster',
      contactEmail: 'kontakt@example.ch',
      journeyMinAge: 12,
      searchIndexing: true,
      inactiveDeleteMonths: 0,
    });
    const pub = await ctx.app.inject({ method: 'GET', url: '/api/config' });
    expect(pub.json()).toMatchObject({
      operatorName: 'Familie Muster',
      contactEmail: 'kontakt@example.ch',
      publicPage: false,
    });
    // the full start page is switched on by an admin
    await call(admin, 'PUT', '/api/admin/settings', { publicPage: true });
    expect((await ctx.app.inject({ method: 'GET', url: '/api/config' })).json().publicPage).toBe(
      true,
    );
    expect(
      (await call(admin, 'PUT', '/api/admin/settings', { contactEmail: 'no-mail' })).statusCode,
    ).toBe(400);
    expect(
      (await call(admin, 'PUT', '/api/admin/settings', { contactEmail: '' })).json().contactEmail,
    ).toBe('');
  });
});

describe('mail pictures', () => {
  it('sends logo and Klavi along as inline pictures', async () => {
    await call(new CookieJar(), 'POST', '/api/auth/email/request', { email: 'pic@example.ch' });
    const mail = ctx.outbox.at(-1)!;
    expect(mail.attachments?.map((a) => a.cid)).toEqual(['klavio-logo@klavio', 'klavi@klavio']);
    expect(mail.html).toContain('src="cid:klavio-logo@klavio"');
    expect(mail.html).toContain('src="cid:klavi@klavio"');
  });
});
