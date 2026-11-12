import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { CookieJar, ORIGIN, setupTestApp } from './helpers.js';
import { runWeeklyReports } from '../src/lib/weeklyReport.js';
import { DailyActivity, LessonProgress, Profile } from '../src/models/index.js';
import type { Mail } from '../src/lib/mailer.js';

let ctx: Awaited<ReturnType<typeof setupTestApp>>;
beforeAll(async () => {
  ctx = await setupTestApp();
});
afterAll(async () => ctx.close());
beforeEach(async () => ctx.reset());

const call = async (
  jar: CookieJar,
  method: 'GET' | 'POST' | 'PATCH',
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

async function family(email: string) {
  const jar = new CookieJar();
  await call(jar, 'POST', '/api/auth/email/request', { email });
  const code = /(\d{6})/.exec(ctx.outbox.at(-1)!.text)![1];
  await call(jar, 'POST', '/api/auth/email/verify', { email, code, displayName: 'Familie' });
  await call(jar, 'POST', '/api/profiles', { name: 'Lina', birthYear: 2016 });
  await call(jar, 'POST', '/api/profiles', { name: 'Tim', birthYear: 2018 });
  return jar;
}

// Monday 9 November 2026, 8 o'clock: the week of 2–8 November is reported
const MONDAY = new Date('2026-11-09T08:00:00Z');

describe('weekly report', () => {
  it('is opt-in, tells every profile’s week, and goes out once per week', async () => {
    const jar = await family('report@example.ch');
    const lina = (await Profile.findOne({ name: 'Lina' }))!;
    await DailyActivity.create([
      { profileId: lina._id, date: '2026-11-03', seconds: 600 },
      { profileId: lina._id, date: '2026-11-05', seconds: 300 },
      { profileId: lina._id, date: '2026-10-20', seconds: 900 }, // another week
    ]);
    await LessonProgress.create({
      profileId: lina._id,
      lessonId: 'keys-c',
      bestStars: 3,
      completions: 1,
      lastLocalDate: '2026-11-05',
    });
    const sent: Mail[] = [];
    const mailer = { send: async (m: Mail) => void sent.push(m) };

    // not switched on: nothing
    expect(await runWeeklyReports(ctx.config, mailer, ctx.app.log, MONDAY)).toEqual({ sent: 0 });

    const res = await call(jar, 'PATCH', '/api/account', { weeklyReport: true });
    expect(res.statusCode).toBe(200);
    expect((await call(jar, 'GET', '/api/auth/me')).json().user.weeklyReport).toBe(true);

    // early Monday: the week has only just ended – wait
    const early = new Date('2026-11-09T04:00:00Z');
    expect(await runWeeklyReports(ctx.config, mailer, ctx.app.log, early)).toEqual({ sent: 0 });

    expect(await runWeeklyReports(ctx.config, mailer, ctx.app.log, MONDAY)).toEqual({ sent: 1 });
    const mail = sent[0]!;
    expect(mail.to).toBe('report@example.ch');
    expect(mail.subject).toContain('2. November');
    expect(mail.text).toContain('Lina');
    expect(mail.text).toContain('15 Minuten geübt, an 2 Tagen');
    expect(mail.text).toContain('1 Lektion gespielt');
    expect(mail.text).toContain('Tim');
    expect(mail.text).toContain('Diese Woche wurde nicht geübt');
    expect(mail.text).toContain('abbestellen');

    // the same week again (an hour later): not twice
    const later = new Date('2026-11-09T09:00:00Z');
    expect(await runWeeklyReports(ctx.config, mailer, ctx.app.log, later)).toEqual({ sent: 0 });

    // switched off again: nothing next week
    await call(jar, 'PATCH', '/api/account', { weeklyReport: false });
    const next = new Date('2026-11-16T08:00:00Z');
    expect(await runWeeklyReports(ctx.config, mailer, ctx.app.log, next)).toEqual({ sent: 0 });
  });
});
