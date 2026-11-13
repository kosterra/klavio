import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import type { FastifyRequest } from 'fastify';
import type { Types } from 'mongoose';
import {
  addDays,
  weekOf,
  CURRICULUM,
  coreLessons,
  applyCompletion,
  findLesson,
  isLessonUnlocked,
  lessonCompleteSchema,
  scoringTarget,
  newlyEarnedBadges,
  levelForXp,
  nextStreak,
  progressQuerySchema,
  REVIEW_INTERVALS,
  starsFor,
  xpFor,
  type LessonProgressDto,
  type LessonResultDto,
  type ProgressDto,
} from '@klavio/shared';
import { DailyActivity, LessonProgress, LessonReceipt, Profile } from '../models/index.js';
import { HttpError, badRequest, notFound } from '../lib/errors.js';

const lessonParams = z.object({ lessonId: z.string().regex(/^[a-z0-9-]{1,64}$/) });

/** Results played offline are synced later — accept up to this many days back. */
const MAX_LATE_DAYS = 14;

/**
 * Learner dates may be ahead of UTC by up to 14 h (→ tomorrow) and results
 * played offline can arrive up to two weeks late.
 */
function plausibleLocalDate(date: string): boolean {
  const utc = new Date().toISOString().slice(0, 10);
  return date >= addDays(utc, -MAX_LATE_DAYS) && date <= addDays(utc, 1);
}

interface ProgressDoc {
  bestStars: number;
  completions?: number | null;
  lastCompletedAt?: Date | null;
  lastLocalDate?: string | null;
  reviewBox?: number | null;
  reviews?: number | null;
}

/** Stored progress → DTO. Older entries without a local date use the completion day (UTC). */
function toDto(l: ProgressDoc): LessonProgressDto {
  return {
    bestStars: l.bestStars,
    completions: l.completions ?? 0,
    lastDate: l.lastLocalDate ?? l.lastCompletedAt?.toISOString().slice(0, 10) ?? null,
    box: l.reviewBox ?? 0,
    reviews: l.reviews ?? 0,
  };
}

/** How long a result's receipt is kept: longer than the device keeps unsent results. */
const RECEIPT_DAYS = MAX_LATE_DAYS + 7;

/**
 * The profile a request is about: the one named (it must be the account's) or
 * the session's active profile. Never one that has been deleted meanwhile.
 */
async function profileOf(req: FastifyRequest, named?: string): Promise<Types.ObjectId> {
  const id = named ?? req.auth!.activeProfileId;
  if (!id) throw new HttpError(409, 'NO_ACTIVE_PROFILE');
  const found = await Profile.exists({ _id: id, userId: req.auth!.user._id });
  if (!found) throw named ? notFound() : new HttpError(409, 'NO_ACTIVE_PROFILE');
  return found._id;
}

function isDuplicateKey(err: unknown): boolean {
  return (err as { code?: number }).code === 11000;
}

/** Progress of one of the account's profiles (default: the session's active one). */
const progressRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', app.requireAuth);

  /**
   * Placement: «I can already do this» – the core lessons before a chapter
   * count as passed (1 star, no XP, no reviews), so one starts there. Lessons
   * already played keep their stars. Parent area: children don't skip ahead.
   */
  app.post(
    '/placement',
    {
      schema: { body: z.object({ chapterId: z.string().max(40) }) },
    },
    async (req, reply) => {
      const profileId = await profileOf(req);
      // parent area – or the start-up questions of a new profile without progress
      const profile = await Profile.findById(profileId, { setupDone: 1 }).lean();
      // (lessons placed by an earlier try of the same questions don't count as played)
      const starting =
        profile?.setupDone === false &&
        !(await LessonProgress.exists({ profileId, placed: { $ne: true } }));
      if (!starting) await app.requireParent(req, reply);
      const ci = CURRICULUM.findIndex((c) => c.id === req.body.chapterId);
      if (ci < 0) throw new HttpError(400, 'UNKNOWN_CHAPTER');
      const skip = CURRICULUM.slice(0, ci).flatMap((c) => coreLessons(c).map((l) => l.id));
      const have = new Set(
        (
          await LessonProgress.find({ profileId, lessonId: { $in: skip } }, { lessonId: 1 }).lean()
        ).map((l) => l.lessonId),
      );
      const add = skip.filter((id) => !have.has(id));
      if (add.length) {
        await LessonProgress.insertMany(
          add.map((lessonId) => ({
            profileId,
            lessonId,
            bestStars: 1,
            completions: 0,
            placed: true,
          })),
        );
      }
      return { placed: add.length };
    },
  );

  app.get(
    '/',
    { schema: { querystring: progressQuerySchema } },
    async (req): Promise<ProgressDto> => {
      const profileId = await profileOf(req, req.query.profileId);
      const monday = weekOf(req.query.date);
      const [lessons, week] = await Promise.all([
        LessonProgress.find({ profileId }).lean(),
        DailyActivity.find({
          profileId,
          date: { $gte: monday, $lte: addDays(monday, 6) },
        }).lean(),
      ]);
      const today = week.find((d) => d.date === req.query.date);
      return {
        lessons: Object.fromEntries(lessons.map((l) => [l.lessonId, toDto(l)])),
        today: { date: req.query.date, seconds: today?.seconds ?? 0, xp: today?.xp ?? 0 },
        weekDays: week
          .filter((d) => (d.seconds ?? 0) > 0 || (d.xp ?? 0) > 0)
          .map((d) => d.date)
          .sort(),
      };
    },
  );

  app.post(
    '/lessons/:lessonId',
    { schema: { params: lessonParams, body: lessonCompleteSchema } },
    async (req): Promise<LessonResultDto> => {
      const profileId = await profileOf(req, req.body.profileId);
      const lesson = findLesson(req.params.lessonId);
      if (!lesson) throw notFound();
      const { mistakes, durationSec, localDate, resultId } = req.body;
      if (!plausibleLocalDate(localDate)) throw badRequest('BAD_DATE');

      // the same result again (the answer got lost on the way): answer as before
      if (resultId) {
        try {
          await LessonReceipt.create({
            _id: resultId,
            profileId,
            expiresAt: new Date(Date.now() + RECEIPT_DAYS * 24 * 60 * 60 * 1000),
          });
        } catch (err) {
          if (!isDuplicateKey(err)) throw err;
          const receipt = await LessonReceipt.findById(resultId).lean();
          if (!receipt || !receipt.profileId.equals(profileId)) throw badRequest('BAD_RESULT_ID');
          // still being saved by the first request: try again in a moment
          if (!receipt.result) throw new HttpError(409, 'RESULT_IN_PROGRESS');
          return receipt.result as LessonResultDto;
        }
      }
      try {
        const result = await saveResult(profileId, lesson, { mistakes, durationSec, localDate });
        if (resultId) await LessonReceipt.updateOne({ _id: resultId }, { $set: { result } });
        return result;
      } catch (err) {
        // not saved: the same result may come again
        if (resultId) await LessonReceipt.deleteOne({ _id: resultId, result: null });
        throw err;
      }
    },
  );
};

/** Saves a finished lesson: stars, XP, review step, day, streak and badges. */
async function saveResult(
  profileId: Types.ObjectId,
  lesson: NonNullable<ReturnType<typeof findLesson>>,
  {
    mistakes,
    durationSec,
    localDate,
  }: { mistakes: number; durationSec: number; localDate: string },
): Promise<LessonResultDto> {
  const done = await LessonProgress.find({ profileId }, { lessonId: 1 }).lean();
  const completed = new Set(done.map((d) => d.lessonId));
  // without the learning path every lesson is open
  const pathOff = !!(await Profile.exists({ _id: profileId, pathOff: true }));
  if (!pathOff && !isLessonUnlocked(lesson.id, completed))
    throw new HttpError(403, 'LESSON_LOCKED');

  // Stars and XP come from the server's copy of the curriculum, not the client.
  // a lesson with a grown-ups' piece: both versions are about as long – the longer counts
  const stars = starsFor(scoringTarget(lesson.id), mistakes);
  const previous = await LessonProgress.findOne({ profileId, lessonId: lesson.id }).lean();
  // skipped at the start («I can already do this»), never played: the first
  // real run counts as the first – XP, celebration, badges
  const placedOnly = !!previous?.placed && !previous.completions;
  const previousBest = placedOnly ? 0 : (previous?.bestStars ?? 0);
  // repetition: due reviews move the lesson on in the schedule and give a bonus
  const { next, wasDue, bonusXp } = applyCompletion(
    previous ? toDto(previous) : undefined,
    stars,
    localDate,
  );
  const replayedToday = previous?.lastLocalDate === localDate;
  let xpGained = xpFor(lesson.xp, stars, previousBest, replayedToday) + bonusXp;

  const saved = await LessonProgress.updateOne(
    { profileId, lessonId: lesson.id },
    {
      $max: { bestStars: stars },
      $inc: { completions: 1, reviews: wasDue ? 1 : 0 },
      $set: {
        lastCompletedAt: new Date(),
        lastLocalDate: next.lastDate,
        reviewBox: next.box,
        placed: false,
      },
    },
    { upsert: true },
  );
  // two submits at the same moment: only the one that created the entry is the first
  const firstCompletion = saved.upsertedCount === 1 || placedOnly;
  if (!previous && !firstCompletion) xpGained = xpFor(lesson.xp, stars, stars, true);
  const today = await DailyActivity.findOneAndUpdate(
    { profileId, date: localDate },
    { $inc: { seconds: durationSec, xp: xpGained } },
    { upsert: true, returnDocument: 'after', lean: true },
  );

  // XP added atomically – parallel lessons don't overwrite each other
  const profile = await Profile.findOneAndUpdate(
    { _id: profileId },
    { $inc: { xp: xpGained } },
    { returnDocument: 'after' },
  );
  if (!profile) throw notFound();
  const levelBefore = levelForXp(profile.xp - xpGained);
  profile.level = levelForXp(profile.xp);
  const streak = nextStreak(
    {
      current: profile.streak?.current ?? 0,
      longest: profile.streak?.longest ?? 0,
      lastActiveDate: profile.streak?.lastActiveDate ?? null,
      freeDayWeek: profile.streak?.freeDayWeek ?? null,
    },
    localDate,
  );
  profile.set('streak', streak);

  // Badges: computed from the updated progress; once earned, kept for good.
  // lessons only skipped at the start earn no badges (no «Chapter done» for a skipped chapter)
  const all = await LessonProgress.find(
    { profileId, placed: { $ne: true } },
    { lessonId: 1, bestStars: 1, reviews: 1, reviewBox: 1 },
  ).lean();
  const owned = new Set((profile.badges ?? []).map((b) => b.id!));
  const newBadges = newlyEarnedBadges(
    {
      lessons: Object.fromEntries(all.map((l) => [l.lessonId, l.bestStars])),
      streak: streak.current,
      todaySeconds: today!.seconds,
      dailyGoalMinutes: profile.dailyGoalMinutes,
      reviews: all.reduce((n, l) => n + (l.reviews ?? 0), 0),
      longTerm: all.filter((l) => (l.reviewBox ?? 0) >= REVIEW_INTERVALS.length - 1).length,
    },
    owned,
  );
  await Profile.updateOne({ _id: profileId }, { $set: { level: profile.level, streak } });
  // each badge only once, even when two results arrive together
  for (const id of newBadges) {
    await Profile.updateOne(
      { _id: profileId, 'badges.id': { $ne: id } },
      { $push: { badges: { id, earnedAt: new Date() } } },
    );
  }

  return {
    stars,
    bestStars: Math.max(stars, previousBest),
    firstCompletion,
    xpGained,
    xp: profile.xp,
    level: profile.level,
    leveledUp: profile.level > levelBefore,
    streak,
    today: { date: localDate, seconds: today!.seconds, xp: today!.xp },
    review: wasDue,
    newBadges,
  };
}

export default progressRoutes;
