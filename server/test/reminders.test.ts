import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createECDH, randomBytes } from 'node:crypto';
import { CookieJar, ORIGIN, setupTestApp } from './helpers.js';
import { b64u, generateVapidKeys } from '../src/lib/webPush.js';
import { localMoment, runReminders } from '../src/lib/reminders.js';
import { DailyActivity, PushReminder } from '../src/models/index.js';

const keys = generateVapidKeys();
let ctx: Awaited<ReturnType<typeof setupTestApp>>;
beforeAll(async () => {
  ctx = await setupTestApp({
    env: { VAPID_PUBLIC_KEY: keys.publicKey, VAPID_PRIVATE_KEY: keys.privateKey },
  });
});
afterAll(async () => ctx.close());
beforeEach(async () => ctx.reset());

const call = async (
  jar: CookieJar,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
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

async function learner(email: string) {
  const jar = new CookieJar();
  await call(jar, 'POST', '/api/auth/email/request', { email });
  const code = /(\d{6})/.exec(ctx.outbox.at(-1)!.text)![1];
  await call(jar, 'POST', '/api/auth/email/verify', { email, code, displayName: 'Familie' });
  const p = (await call(jar, 'POST', '/api/profiles', { name: 'Lina', birthYear: 2016 })).json();
  await call(jar, 'POST', '/api/profiles/select', { profileId: p.id });
  return { jar, profileId: p.id as string };
}

const ua = createECDH('prime256v1');
ua.generateKeys();
const subscription = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/device-1',
  keys: { p256dh: b64u.encode(ua.getPublicKey()), auth: b64u.encode(randomBytes(16)) },
};

describe('practice reminders', () => {
  it('the public key is published; a reminder is set up, shown and switched off', async () => {
    expect((await ctx.app.inject({ url: '/api/config' })).json().pushPublicKey).toBe(
      keys.publicKey,
    );
    const { jar, profileId } = await learner('rem@example.ch');
    const set = await call(jar, 'PUT', '/api/reminders', {
      subscription,
      time: '17:30',
      days: [1, 3, 5],
      tz: 'Europe/Zurich',
    });
    expect(set.statusCode).toBe(200);
    const status = await call(jar, 'POST', '/api/reminders/status', {
      endpoint: subscription.endpoint,
    });
    expect(status.json()).toEqual({ time: '17:30', days: [1, 3, 5], profileId });
    // never to anywhere else than a push service
    const evil = await call(jar, 'PUT', '/api/reminders', {
      subscription: { ...subscription, endpoint: 'https://169.254.169.254/latest/meta-data' },
      time: '17:30',
      days: [1],
      tz: 'Europe/Zurich',
    });
    expect(evil.statusCode).toBe(400);
    // another account does not see it
    const other = await learner('other@example.ch');
    expect(
      (
        await call(other.jar, 'POST', '/api/reminders/status', { endpoint: subscription.endpoint })
      ).json(),
    ).toBeNull();
    await call(jar, 'POST', '/api/reminders/off', { endpoint: subscription.endpoint });
    expect(await PushReminder.countDocuments()).toBe(0);
  });

  it('reminds at its time, once a day, not after practice, and forgets a dropped browser', async () => {
    const { jar, profileId } = await learner('due@example.ch');
    await call(jar, 'PUT', '/api/reminders', {
      subscription,
      time: '17:30',
      days: [1, 2, 3, 4, 5, 6, 7],
      tz: 'Europe/Zurich',
    });
    const sent: { title: string }[] = [];
    const send = async (_t: unknown, message: unknown) => {
      sent.push(message as { title: string });
      return 'sent' as const;
    };
    // Tuesday 10 Nov 2026, 17:00 in Zurich (16:00 UTC): not yet
    expect(
      (await runReminders(ctx.config, ctx.app.log, new Date('2026-11-10T16:00:00Z'), send)).sent,
    ).toBe(0);
    // 17:31: now – and only once
    expect(
      (await runReminders(ctx.config, ctx.app.log, new Date('2026-11-10T16:31:00Z'), send)).sent,
    ).toBe(1);
    expect(sent[0]!.title).toBe('Lina, Zeit fürs Klavier!');
    expect(
      (await runReminders(ctx.config, ctx.app.log, new Date('2026-11-10T16:40:00Z'), send)).sent,
    ).toBe(0);
    // the next day Lina has practised already: no reminder
    await DailyActivity.create({ profileId, date: '2026-11-11', seconds: 300 });
    const r = await runReminders(ctx.config, ctx.app.log, new Date('2026-11-11T16:45:00Z'), send);
    expect(r).toMatchObject({ sent: 0, skipped: 1 });
    // the browser has dropped the subscription: forgotten
    const gone = async () => 'gone' as const;
    expect(
      (await runReminders(ctx.config, ctx.app.log, new Date('2026-11-12T16:45:00Z'), gone)).removed,
    ).toBe(1);
    expect(await PushReminder.countDocuments()).toBe(0);
  });

  it('knows the local day and time of a time zone', () => {
    expect(localMoment(new Date('2026-11-10T23:30:00Z'), 'Europe/Zurich')).toEqual({
      date: '2026-11-11',
      minutes: 30,
      weekday: 3,
    });
  });
});
