import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { LightMyRequestResponse } from 'fastify';
import { LESSONS, addDays } from '@klavio/shared';
import { CookieJar, ORIGIN, setupTestApp } from './helpers.js';

let ctx: Awaited<ReturnType<typeof setupTestApp>>;
beforeAll(async () => {
  ctx = await setupTestApp();
});
afterAll(async () => ctx.close());
beforeEach(async () => ctx.reset());

async function call(
  jar: CookieJar,
  method: 'GET' | 'POST' | 'DELETE',
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

const today = new Date().toISOString().slice(0, 10);

/** Signed-up account with one selected profile. */
async function learner(email = 'kid@example.ch') {
  const jar = new CookieJar();
  await call(jar, 'POST', '/api/auth/email/request', { email });
  const code = /(\d{6})/.exec(ctx.outbox.at(-1)!.text)![1];
  await call(jar, 'POST', '/api/auth/email/verify', { email, code, displayName: 'Familie' });
  const profile = (
    await call(jar, 'POST', '/api/profiles', { name: 'Lina', birthYear: 2016 })
  ).json();
  await call(jar, 'POST', '/api/profiles/select', { profileId: profile.id });
  return { jar, profileId: profile.id as string };
}

const complete = (jar: CookieJar, lessonId: string, body: object = {}) =>
  call(jar, 'POST', `/api/progress/lessons/${lessonId}`, {
    mistakes: 0,
    durationSec: 120,
    localDate: today,
    ...body,
  });

const [first, second, third] = LESSONS;

describe('lesson progress', () => {
  it('needs a selected profile', async () => {
    const jar = new CookieJar();
    await call(jar, 'POST', '/api/auth/email/request', { email: 'p@example.ch' });
    const code = /(\d{6})/.exec(ctx.outbox.at(-1)!.text)![1];
    await call(jar, 'POST', '/api/auth/email/verify', {
      email: 'p@example.ch',
      code,
      displayName: 'P',
    });
    expect((await call(jar, 'GET', `/api/progress?date=${today}`)).json()).toEqual({
      error: 'NO_ACTIVE_PROFILE',
    });
  });

  it('completes the first lesson: stars, XP, streak and practice time', async () => {
    const { jar } = await learner();
    const res = await complete(jar, first!.id, { mistakes: 0, durationSec: 95 });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      stars: 3,
      bestStars: 3,
      firstCompletion: true,
      xpGained: first!.xp + 15,
      xp: first!.xp + 15,
      level: 1,
      leveledUp: false,
      streak: { current: 1, longest: 1, lastActiveDate: today },
      today: { date: today, seconds: 95, xp: first!.xp + 15 },
    });

    const progress = (await call(jar, 'GET', `/api/progress?date=${today}`)).json();
    expect(progress.lessons[first!.id]).toMatchObject({ bestStars: 3, completions: 1 });
    expect(progress.today).toEqual({ date: today, seconds: 95, xp: first!.xp + 15 });

    const profile = (await call(jar, 'GET', '/api/profiles')).json()[0];
    expect(profile).toMatchObject({ xp: first!.xp + 15, streak: { current: 1 } });
  });

  it('awards badges once and lists them on the profile', async () => {
    const { jar } = await learner();
    const a = (await complete(jar, first!.id, { mistakes: 0 })).json();
    expect(a.newBadges).toEqual(['first-lesson', 'perfect']);
    const b = (await complete(jar, first!.id, { mistakes: 0 })).json();
    expect(b.newBadges).toEqual([]);
    const profile = (await call(jar, 'GET', '/api/profiles')).json()[0];
    expect(profile.badges.map((x: { id: string }) => x.id)).toEqual(['first-lesson', 'perfect']);
  });

  it('awards the daily-goal badge when the practice time reaches the goal', async () => {
    const { jar } = await learner();
    // default goal: 10 minutes
    const a = (await complete(jar, first!.id, { durationSec: 300 })).json();
    expect(a.newBadges).not.toContain('daily-goal');
    const b = (await complete(jar, first!.id, { durationSec: 300 })).json();
    expect(b.newBadges).toContain('daily-goal');
  });

  it('keeps later lessons locked until the previous one is done', async () => {
    const { jar } = await learner();
    expect((await complete(jar, second!.id)).json()).toEqual({ error: 'LESSON_LOCKED' });
    await complete(jar, first!.id);
    expect((await complete(jar, second!.id)).statusCode).toBe(200);
    expect((await complete(jar, third!.id)).statusCode).toBe(200);
  });

  it('computes stars from mistakes on the server and keeps the best result', async () => {
    const { jar } = await learner();
    const many = await complete(jar, first!.id, { mistakes: 20 });
    expect(many.json()).toMatchObject({ stars: 1, xpGained: first!.xp + 5 });
    const better = await complete(jar, first!.id, { mistakes: 0 });
    // replay on the same day: only the improved stars count (5 each)
    expect(better.json()).toMatchObject({
      stars: 3,
      bestStars: 3,
      firstCompletion: false,
      xpGained: 10,
    });
    const worse = await complete(jar, first!.id, { mistakes: 20 });
    expect(worse.json()).toMatchObject({ stars: 1, bestStars: 3, xpGained: 0 });
    // the next day practising it again earns half the lesson XP once more
    expect(
      (await complete(jar, first!.id, { localDate: addDays(today, -1) })).json(),
    ).toMatchObject({ xpGained: Math.round(first!.xp / 2) });
    const progress = (await call(jar, 'GET', `/api/progress?date=${today}`)).json();
    expect(progress.lessons[first!.id]).toMatchObject({ bestStars: 3, completions: 4 });
  });

  it('counts a lesson submitted twice at once only once as first completion', async () => {
    const { jar } = await learner();
    const [a, b] = await Promise.all([complete(jar, first!.id), complete(jar, first!.id)]);
    const firsts = [a.json(), b.json()].filter((r) => r.firstCompletion);
    expect(firsts).toHaveLength(1);
    const profile = (await call(jar, 'GET', '/api/profiles')).json()[0];
    expect(profile.xp).toBe(a.json().xpGained + b.json().xpGained);
    expect(profile.badges.filter((x: { id: string }) => x.id === 'first-lesson')).toHaveLength(1);
  });

  it('levels up and extends the streak on consecutive days', async () => {
    const { jar } = await learner();
    const yesterday = addDays(today, -1);
    const a = (await complete(jar, first!.id, { localDate: yesterday })).json();
    expect(a.streak.current).toBe(1);
    const b = (await complete(jar, second!.id)).json();
    expect(b.streak).toMatchObject({ current: 2, longest: 2, lastActiveDate: today });
    expect(b.xp).toBeGreaterThanOrEqual(50);
    expect(b).toMatchObject({ level: 2, leveledUp: true });
  });

  it('accepts results synced late (offline) without touching the streak', async () => {
    const { jar } = await learner();
    await complete(jar, first!.id);
    const late = (await complete(jar, second!.id, { localDate: addDays(today, -5) })).json();
    expect(late.streak).toMatchObject({ current: 1, longest: 1, lastActiveDate: today });
    expect(late.today).toMatchObject({ date: addDays(today, -5), seconds: 120 });
  });

  it('rejects implausible dates, unknown lessons and bad input', async () => {
    const { jar } = await learner();
    expect((await complete(jar, first!.id, { localDate: '2020-01-01' })).json()).toEqual({
      error: 'BAD_DATE',
    });
    expect((await complete(jar, first!.id, { localDate: addDays(today, 2) })).json()).toEqual({
      error: 'BAD_DATE',
    });
    expect((await complete(jar, 'no-such-lesson')).statusCode).toBe(404);
    expect((await complete(jar, first!.id, { mistakes: -1 })).statusCode).toBe(400);
    expect((await complete(jar, first!.id, { durationSec: 99999 })).statusCode).toBe(400);
    // days that don't exist are rejected – and the lesson keeps working afterwards
    for (const localDate of ['2026-11-00', '2026-02-30', '2026-13-01']) {
      expect((await complete(jar, first!.id, { localDate })).statusCode).toBe(400);
    }
    expect((await complete(jar, first!.id)).statusCode).toBe(200);
    expect((await call(jar, 'GET', '/api/progress?date=2026-13-45')).statusCode).toBe(400);
  });

  it('is scoped to the profile and removed with it', async () => {
    const { jar, profileId } = await learner();
    await complete(jar, first!.id);
    const other = (
      await call(jar, 'POST', '/api/profiles', { name: 'Ben', birthYear: 2018 })
    ).json();
    await call(jar, 'POST', '/api/profiles/select', { profileId: other.id });
    expect((await call(jar, 'GET', `/api/progress?date=${today}`)).json().lessons).toEqual({});

    await call(jar, 'DELETE', `/api/profiles/${profileId}`);
    const { LessonProgress, DailyActivity } = await import('../src/models/index.js');
    expect(await LessonProgress.countDocuments({ profileId })).toBe(0);
    expect(await DailyActivity.countDocuments({ profileId })).toBe(0);
  });
});

describe('repetition', () => {
  it('a lesson is due a day later; reviewing it moves it on and gives a bonus', async () => {
    const { jar } = await learner('review@example.ch');
    const yesterday = addDays(today, -1);
    const firstRun = (await complete(jar, first!.id, { localDate: yesterday })).json();
    expect(firstRun.review).toBe(false);

    let progress = (await call(jar, 'GET', `/api/progress?date=${today}`)).json();
    expect(progress.lessons[first!.id]).toMatchObject({ lastDate: yesterday, box: 0, reviews: 0 });

    const review = (await complete(jar, first!.id)).json();
    expect(review.review).toBe(true);
    expect(review.newBadges).toContain('review-first'); // the first repetition medal
    // replay XP (half) + 5 per new star (none) + review bonus
    expect(review.xpGained).toBe(Math.round(first!.xp / 2) + 5);

    progress = (await call(jar, 'GET', `/api/progress?date=${today}`)).json();
    expect(progress.lessons[first!.id]).toMatchObject({ lastDate: today, box: 1, reviews: 1 });

    // played again the same day: not due any more, no bonus
    const again = (await complete(jar, first!.id)).json();
    expect(again.review).toBe(false);
  });
});

describe('results synced later', () => {
  it('a result names its profile: a sibling, never another account', async () => {
    const { jar, profileId: lina } = await learner();
    const tim = (await call(jar, 'POST', '/api/profiles', { name: 'Tim', birthYear: 2017 })).json()
      .id as string;
    // Lina is active; Tim's result played offline arrives with his id
    const res = await complete(jar, first!.id, { profileId: tim });
    expect(res.statusCode).toBe(200);
    const timProgress = (
      await call(jar, 'GET', `/api/progress?date=${today}&profileId=${tim}`)
    ).json();
    expect(timProgress.lessons[first!.id].bestStars).toBe(3);
    const linaProgress = (await call(jar, 'GET', `/api/progress?date=${today}`)).json();
    expect(linaProgress.lessons[first!.id]).toBeUndefined();
    // the session's profile stays Lina's
    expect((await call(jar, 'GET', '/api/auth/me')).json().activeProfileId).toBe(lina);

    const other = await learner('other@example.ch');
    expect((await complete(other.jar, first!.id, { profileId: tim })).statusCode).toBe(404);
    expect(
      (await call(other.jar, 'GET', `/api/progress?date=${today}&profileId=${tim}`)).statusCode,
    ).toBe(404);
  });

  it('the same result sent twice is counted once', async () => {
    const { jar } = await learner();
    const resultId = crypto.randomUUID();
    const a = (await complete(jar, first!.id, { resultId, durationSec: 100 })).json();
    const b = await complete(jar, first!.id, { resultId, durationSec: 100 });
    expect(b.statusCode).toBe(200);
    expect(b.json()).toEqual(a);
    const progress = (await call(jar, 'GET', `/api/progress?date=${today}`)).json();
    expect(progress.lessons[first!.id].completions).toBe(1);
    expect(progress.today.seconds).toBe(100);
    // another account cannot read an answer with someone else's id
    const other = await learner('other2@example.ch');
    expect((await complete(other.jar, first!.id, { resultId })).statusCode).toBe(400);
  });

  it('a result for a deleted profile leaves nothing behind', async () => {
    const { jar } = await learner();
    const tim = (await call(jar, 'POST', '/api/profiles', { name: 'Tim', birthYear: 2017 })).json()
      .id as string;
    expect((await call(jar, 'DELETE', `/api/profiles/${tim}`)).statusCode).toBe(204);
    expect((await complete(jar, first!.id, { profileId: tim })).statusCode).toBe(404);
    const { LessonProgress, DailyActivity } = await import('../src/models/index.js');
    expect(await LessonProgress.countDocuments({ profileId: tim })).toBe(0);
    expect(await DailyActivity.countDocuments({ profileId: tim })).toBe(0);
  });
});

describe('sessions in use', () => {
  it('are renewed, so someone who practises stays logged in', async () => {
    const { jar } = await learner();
    const { Session } = await import('../src/models/index.js');
    // as if logged in 50 days ago
    await Session.updateMany({}, { $set: { expiresAt: new Date(Date.now() + 10 * 864e5) } });
    const res = await call(jar, 'GET', '/api/auth/me');
    expect(res.statusCode).toBe(200);
    expect(res.headers['set-cookie']).toBeDefined();
    const s = await Session.findOne().lean();
    expect(s!.expiresAt.getTime()).toBeGreaterThan(Date.now() + 59 * 864e5);
  });
});
