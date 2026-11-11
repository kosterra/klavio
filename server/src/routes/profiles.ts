import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  MAX_PROFILES_PER_ACCOUNT,
  profileCreateSchema,
  profileUpdateSchema,
  selectProfileSchema,
  canChooseWorld,
  OUTFITS,
  addDays,
  CORE_LESSONS,
  nextLesson,
  weekOf,
  type ProfileDto,
  type ProfileOverviewDto,
  type GoalSong,
  type Motive,
  type PlayOn,
  type Outfit,
  type WorldSet,
} from '@klavio/shared';
import type { AppConfig } from '../config.js';
import { getSettings } from '../lib/settings.js';
import {
  DailyActivity,
  LessonReceipt,
  LessonProgress,
  Profile,
  Session,
  type ProfileDoc,
} from '../models/index.js';
import { HttpError, notFound } from '../lib/errors.js';

/** The lessons that count for «done» (bonus lessons don't). */
const CORE_IDS = new Set(CORE_LESSONS.map((l) => l.id));

const idParams = z.object({ id: z.string().regex(/^[a-f0-9]{24}$/) });

export function profileToDto(p: ProfileDoc): ProfileDto {
  return {
    id: p._id.toString(),
    name: p.name,
    avatar: p.avatar as ProfileDto['avatar'],
    uiMode: p.uiMode as ProfileDto['uiMode'],
    dailyGoalMinutes: p.dailyGoalMinutes,
    calibration: {
      a4Hz: p.calibration?.a4Hz ?? 440,
      noiseFloorDb: p.calibration?.noiseFloorDb ?? null,
      inputGain: p.calibration?.inputGain ?? 1,
    },
    xp: p.xp,
    level: p.level,
    streak: {
      current: p.streak?.current ?? 0,
      longest: p.streak?.longest ?? 0,
      lastActiveDate: p.streak?.lastActiveDate ?? null,
      freeDayWeek: p.streak?.freeDayWeek ?? null,
    },
    badges: (p.badges ?? []).map((b) => ({ id: b.id!, earnedAt: b.earnedAt!.toISOString() })),
    birthYear: p.birthYear ?? null,
    world: (p.world as WorldSet | null | undefined) ?? null,
    outfit: (p.outfit as Outfit | null | undefined) ?? null,
    setupDone: p.setupDone ?? true,
    motive: (p.motive as Motive | null | undefined) ?? null,
    weeklyGoalDays: p.weeklyGoalDays ?? null,
    playOn: (p.playOn as PlayOn | null | undefined) ?? null,
    goalSong: p.goalSong?.title
      ? {
          title: p.goalSong.title,
          style: p.goalSong.style as GoalSong['style'],
          skills: (p.goalSong.skills ?? []) as GoalSong['skills'],
        }
      : null,
  };
}

/** Learner profiles of the logged-in account (e.g. parent + children). */
const profileRoutes: FastifyPluginAsyncZod<{ config: AppConfig }> = async (app, { config }) => {
  app.addHook('preHandler', app.requireAuth);

  /** The journey only from the age admins set; the kids' worlds are always fine. */
  const checkWorld = async (world: WorldSet | null | undefined, birthYear: number | null) => {
    if (world !== 'journey') return;
    const { journeyMinAge } = await getSettings(config);
    if (!canChooseWorld(birthYear, journeyMinAge)) throw new HttpError(400, 'WORLD_TOO_YOUNG');
  };

  /** Progress of every profile of the account: lessons, stars, minutes per week. */
  app.get(
    '/overview',
    { schema: { querystring: z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }) } },
    async (req): Promise<ProfileOverviewDto[]> => {
      const today = req.query.date;
      const thisWeek = weekOf(today);
      const weeks = Array.from({ length: 8 }, (_, i) => addDays(thisWeek, (i - 7) * 7));
      const profiles = await Profile.find({ userId: req.auth!.user._id })
        .sort({ createdAt: 1 })
        .lean<ProfileDoc[]>();
      const ids = profiles.map((p) => p._id);
      const [progress, days] = await Promise.all([
        LessonProgress.find({ profileId: { $in: ids }, bestStars: { $gt: 0 } }).lean(),
        DailyActivity.find({ profileId: { $in: ids }, date: { $gte: weeks[0]! } }).lean(),
      ]);
      const since28 = addDays(today, -27);
      return profiles.map((p) => {
        const mine = progress.filter((l) => l.profileId.equals(p._id));
        const coreDone = mine.filter((l) => CORE_IDS.has(l.lessonId)).length;
        const myDays = days.filter((d) => d.profileId.equals(p._id));
        return {
          profile: profileToDto(p),
          lessonsDone: coreDone,
          nextLessonId:
            coreDone >= CORE_IDS.size ? null : nextLesson(new Set(mine.map((l) => l.lessonId))).id,
          stars: mine.reduce((n, l) => n + l.bestStars, 0),
          weeks: weeks.map((week) => ({
            week,
            minutes: Math.round(
              myDays
                .filter((d) => d.date >= week && d.date < addDays(week, 7))
                .reduce((n, d) => n + (d.seconds ?? 0), 0) / 60,
            ),
          })),
          activeDays: myDays.filter((d) => d.date >= since28 && (d.seconds ?? 0) > 0).length,
        };
      });
    },
  );

  app.get('/', async (req) => {
    const list = await Profile.find({ userId: req.auth!.user._id })
      .sort({ createdAt: 1 })
      .lean<ProfileDoc[]>();
    return list.map(profileToDto);
  });

  app.post(
    '/',
    { schema: { body: profileCreateSchema }, preHandler: app.requireParent },
    async (req, reply) => {
      const userId = req.auth!.user._id;
      if ((await Profile.countDocuments({ userId })) >= MAX_PROFILES_PER_ACCOUNT) {
        throw new HttpError(400, 'PROFILE_LIMIT');
      }
      await checkWorld(req.body.world, req.body.birthYear);
      const created = await Profile.create({ ...req.body, userId, setupDone: false });
      // two at once can both pass the count above – the later one gives way
      if ((await Profile.countDocuments({ userId })) > MAX_PROFILES_PER_ACCOUNT) {
        await Profile.deleteOne({ _id: created._id });
        throw new HttpError(400, 'PROFILE_LIMIT');
      }
      return reply.code(201).send(profileToDto(created.toObject() as ProfileDoc));
    },
  );

  app.patch(
    '/:id',
    { schema: { params: idParams, body: profileUpdateSchema } },
    async (req, reply) => {
      const { calibration, ...rest } = req.body;
      // Learners may pick their own figure, set their goal song, answer the
      // start-up questions and save their microphone calibration; name,
      // display mode and daily goal are parent area.
      const learnerKeys = [
        'avatar',
        'goalSong',
        'outfit',
        'setupDone',
        'motive',
        'weeklyGoalDays',
        'playOn',
      ];
      const parentOnly = Object.keys(rest).filter((k) => !learnerKeys.includes(k));
      // a learner changes their own profile – a sibling's only with the parent area
      const own = req.auth!.activeProfileId?.toString() === req.params.id;
      if (parentOnly.length > 0 || !own) await app.requireParent(req, reply);
      const update: Record<string, unknown> = {};
      if (rest.world === 'journey' || rest.birthYear !== undefined) {
        const current = await Profile.findOne(
          { _id: req.params.id, userId: req.auth!.user._id },
          { birthYear: 1, world: 1 },
        ).lean<ProfileDoc>();
        if (!current) throw notFound();
        const birthYear = rest.birthYear ?? current.birthYear ?? null;
        if (rest.world === 'journey') await checkWorld('journey', birthYear);
        else if (rest.world === undefined && current.world === 'journey') {
          // a corrected birth year below the minimum age: back to the kids' worlds
          const { journeyMinAge } = await getSettings(config);
          if (!canChooseWorld(birthYear, journeyMinAge)) update.world = null;
        }
      }
      if (rest.outfit) {
        // a piece is worn only from its level on
        const own = await Profile.findOne(
          { _id: req.params.id, userId: req.auth!.user._id },
          { level: 1 },
        ).lean<ProfileDoc>();
        if (!own) throw notFound();
        const need = OUTFITS.find((o) => o.id === rest.outfit)!.level;
        if (own.level < need) throw new HttpError(400, 'OUTFIT_LOCKED');
      }
      Object.assign(update, rest);
      for (const [k, v] of Object.entries(calibration ?? {})) update[`calibration.${k}`] = v;
      const updated = await Profile.findOneAndUpdate(
        { _id: req.params.id, userId: req.auth!.user._id },
        { $set: update },
        { returnDocument: 'after' },
      ).lean<ProfileDoc>();
      if (!updated) throw notFound();
      return profileToDto(updated);
    },
  );

  app.delete(
    '/:id',
    { schema: { params: idParams }, preHandler: app.requireParent },
    async (req, reply) => {
      const res = await Profile.deleteOne({ _id: req.params.id, userId: req.auth!.user._id });
      if (res.deletedCount === 0) throw notFound();
      await Promise.all([
        LessonProgress.deleteMany({ profileId: req.params.id }),
        DailyActivity.deleteMany({ profileId: req.params.id }),
        LessonReceipt.deleteMany({ profileId: req.params.id }),
      ]);
      await Session.updateMany({ activeProfileId: req.params.id }, { activeProfileId: null });
      return reply.code(204).send();
    },
  );

  /** Select the active profile for this session (profile picker after login). */
  app.post('/select', { schema: { body: selectProfileSchema } }, async (req) => {
    const owns = await Profile.exists({ _id: req.body.profileId, userId: req.auth!.user._id });
    if (!owns) throw notFound();
    // Choosing a learner's profile hands the device over: the parent area locks again.
    await Session.updateOne(
      { _id: req.auth!.sessionId },
      { activeProfileId: req.body.profileId, parentUnlockedUntil: null },
    );
    return { activeProfileId: req.body.profileId };
  });
};

export default profileRoutes;
