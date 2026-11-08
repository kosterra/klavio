import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { CookieJar, ORIGIN, setupTestApp } from './helpers.js';
import { runRetention } from '../src/lib/retention.js';
import { AppSettings, Profile, User } from '../src/models/index.js';

let ctx: Awaited<ReturnType<typeof setupTestApp>>;
beforeAll(async () => {
  ctx = await setupTestApp();
});
afterAll(async () => ctx.close());
beforeEach(async () => ctx.reset());

const call = async (jar: CookieJar, method: 'GET' | 'POST', url: string, payload?: unknown) => {
  const res = await ctx.app.inject({
    method,
    url,
    payload: payload as object,
    headers: { origin: ORIGIN, cookie: jar.header },
  });
  jar.store(res);
  return res;
};

async function signUp(email: string, lang?: 'de' | 'en') {
  const jar = new CookieJar();
  await call(jar, 'POST', '/api/auth/email/request', { email, lang });
  const code = /(\d{6})/.exec(ctx.outbox.at(-1)!.text)![1];
  await call(jar, 'POST', '/api/auth/email/verify', {
    email,
    code,
    displayName: 'Familie',
    lang,
  });
  await call(jar, 'POST', '/api/profiles', { name: 'Lina', birthYear: 2016 });
  return jar;
}

const months = (n: number, from = new Date()) => {
  const d = new Date(from);
  d.setMonth(d.getMonth() + n);
  return d;
};

describe('data export', () => {
  it('gives the account everything stored about it, without secrets', async () => {
    const jar = await signUp('eva@example.ch');
    const res = await call(jar, 'GET', '/api/account/export');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-disposition']).toMatch(/attachment; filename="klavio-.*\.json"/);
    const data = res.json();
    expect(data.account).toMatchObject({ email: 'eva@example.ch', parentPin: 'not set' });
    expect(data.profiles[0]).toMatchObject({ name: 'Lina', birthYear: 2016, lessons: [] });
    expect(JSON.stringify(data)).not.toMatch(/publicKey|Hash|webauthnUserId/);
    expect((await ctx.app.inject({ url: '/api/account/export' })).statusCode).toBe(401);
  });
});

describe('deleting long-inactive accounts', () => {
  it('does nothing while admins have not set it', async () => {
    await signUp('old@example.ch');
    await User.updateMany({}, { lastActiveAt: months(-60) });
    expect(await runRetention(ctx.config, { send: async () => {} }, ctx.app.log)).toEqual({
      warned: 0,
      deleted: 0,
    });
  });

  it('warns first, deletes 30 days later – unless the account is used again', async () => {
    await AppSettings.updateOne(
      { _id: 'global' },
      { registrationOpen: true, inactiveDeleteMonths: 12 },
      { upsert: true },
    );
    const keeper = await signUp('keeper@example.ch');
    await signUp('gone@example.ch', 'en');
    await signUp('fresh@example.ch');
    await User.updateMany({ email: { $ne: 'fresh@example.ch' } }, { lastActiveAt: months(-13) });
    const mailer = { sent: [] as { to: string; subject: string }[] };
    const send = { send: async (m: { to: string; subject: string }) => void mailer.sent.push(m) };

    // the warning, in the account's language
    expect(await runRetention(ctx.config, send, ctx.app.log)).toEqual({ warned: 2, deleted: 0 });
    expect(mailer.sent.map((m) => m.subject).sort()).toEqual([
      'Dein Klavio-Konto wird bald gelöscht',
      'Your Klavio account will be deleted soon',
    ]);
    // no second warning
    expect(await runRetention(ctx.config, send, ctx.app.log)).toEqual({ warned: 0, deleted: 0 });

    // «keeper» signs in again
    await call(keeper, 'GET', '/api/auth/me');

    // 31 days later: only the unused one is deleted, with its profiles
    const later = new Date(Date.now() + 31 * 864e5);
    expect(await runRetention(ctx.config, send, ctx.app.log, later)).toEqual({
      warned: 0,
      deleted: 1,
    });
    expect(await User.exists({ email: 'gone@example.ch' })).toBeNull();
    expect(await User.exists({ email: 'keeper@example.ch' })).not.toBeNull();
    expect(await Profile.countDocuments()).toBe(2);
  });
});

describe('family overview', () => {
  it('shows lessons, stars and minutes per week of every profile', async () => {
    const jar = await signUp('family@example.ch');
    const { DailyActivity, LessonProgress } = await import('../src/models/index.js');
    const profile = (await Profile.findOne({ name: 'Lina' }))!;
    await LessonProgress.create([
      { profileId: profile._id, lessonId: 'keys-c', bestStars: 3, completions: 1 },
      { profileId: profile._id, lessonId: 'keys-middle-c', bestStars: 2, completions: 1 },
    ]);
    await DailyActivity.create([
      { profileId: profile._id, date: '2026-11-08', seconds: 600 },
      { profileId: profile._id, date: '2026-11-03', seconds: 300 },
      { profileId: profile._id, date: '2026-10-01', seconds: 900 },
    ]);
    const res = await call(jar, 'GET', '/api/profiles/overview?date=2026-11-08');
    expect(res.statusCode).toBe(200);
    const [lina] = res.json();
    expect(lina).toMatchObject({
      lessonsDone: 2,
      stars: 5,
      nextLessonId: 'keys-d-e',
      activeDays: 2,
    });
    expect(lina.weeks).toHaveLength(8);
    // Mon 2 Nov – Sun 8 Nov: 5 + 10 minutes
    expect(lina.weeks.at(-1)).toEqual({ week: '2026-11-02', minutes: 15 });
  });
});

describe('placement', () => {
  it('passes the lessons before a chapter (parent area), keeping stars already earned', async () => {
    const jar = await signUp('adult@example.ch');
    const profile = (await Profile.findOne({ name: 'Lina' }))!;
    await call(jar, 'POST', '/api/profiles/select', { profileId: profile._id.toString() });
    const { LessonProgress } = await import('../src/models/index.js');
    await LessonProgress.create({ profileId: profile._id, lessonId: 'keys-c', bestStars: 3 });
    const res = await call(jar, 'POST', '/api/progress/placement', { chapterId: 'read' });
    expect(res.statusCode).toBe(200);
    const lessons = await LessonProgress.find({ profileId: profile._id }).lean();
    expect(lessons.find((l) => l.lessonId === 'keys-c')!.bestStars).toBe(3);
    expect(lessons.find((l) => l.lessonId === 'hand-entchen')).toMatchObject({
      bestStars: 1,
      placed: true,
    });
    expect(lessons.some((l) => l.lessonId.startsWith('read-'))).toBe(false);
    expect(
      (await call(jar, 'POST', '/api/progress/placement', { chapterId: 'nope' })).statusCode,
    ).toBe(400);
  });
});
