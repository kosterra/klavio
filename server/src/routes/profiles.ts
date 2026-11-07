import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  MAX_PROFILES_PER_ACCOUNT,
  profileCreateSchema,
  profileUpdateSchema,
  selectProfileSchema,
  type ProfileDto,
} from '@klavio/shared';
import {
  DailyActivity,
  LessonProgress,
  Profile,
  Session,
  type ProfileDoc,
} from '../models/index.js';
import { HttpError, notFound } from '../lib/errors.js';

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
    },
    badges: (p.badges ?? []).map((b) => ({ id: b.id!, earnedAt: b.earnedAt!.toISOString() })),
  };
}

/** Learner profiles of the logged-in account (e.g. parent + children). */
const profileRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', app.requireAuth);

  app.get('/', async (req) => {
    const list = await Profile.find({ userId: req.auth!.user._id })
      .sort({ createdAt: 1 })
      .lean<ProfileDoc[]>();
    return list.map(profileToDto);
  });

  app.post('/', { schema: { body: profileCreateSchema } }, async (req, reply) => {
    const userId = req.auth!.user._id;
    if ((await Profile.countDocuments({ userId })) >= MAX_PROFILES_PER_ACCOUNT) {
      throw new HttpError(400, 'PROFILE_LIMIT');
    }
    const created = await Profile.create({ ...req.body, userId });
    return reply.code(201).send(profileToDto(created.toObject() as ProfileDoc));
  });

  app.patch('/:id', { schema: { params: idParams, body: profileUpdateSchema } }, async (req) => {
    const { calibration, ...rest } = req.body;
    const update: Record<string, unknown> = { ...rest };
    for (const [k, v] of Object.entries(calibration ?? {})) update[`calibration.${k}`] = v;
    const updated = await Profile.findOneAndUpdate(
      { _id: req.params.id, userId: req.auth!.user._id },
      { $set: update },
      { returnDocument: 'after' },
    ).lean<ProfileDoc>();
    if (!updated) throw notFound();
    return profileToDto(updated);
  });

  app.delete('/:id', { schema: { params: idParams } }, async (req, reply) => {
    const res = await Profile.deleteOne({ _id: req.params.id, userId: req.auth!.user._id });
    if (res.deletedCount === 0) throw notFound();
    await Promise.all([
      LessonProgress.deleteMany({ profileId: req.params.id }),
      DailyActivity.deleteMany({ profileId: req.params.id }),
    ]);
    await Session.updateMany({ activeProfileId: req.params.id }, { activeProfileId: null });
    return reply.code(204).send();
  });

  /** Select the active profile for this session (profile picker after login). */
  app.post('/select', { schema: { body: selectProfileSchema } }, async (req) => {
    const owns = await Profile.exists({ _id: req.body.profileId, userId: req.auth!.user._id });
    if (!owns) throw notFound();
    await Session.updateOne({ _id: req.auth!.sessionId }, { activeProfileId: req.body.profileId });
    return { activeProfileId: req.body.profileId };
  });
};

export default profileRoutes;
