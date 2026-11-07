import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import type { Types } from 'mongoose';
import {
  accountEmailVerifySchema,
  accountUpdateSchema,
  emailRequestSchema,
  parentPinSchema,
} from '@klavio/shared';
import type { AppConfig } from '../config.js';
import {
  DailyActivity,
  EmailCode,
  LessonProgress,
  Passkey,
  Profile,
  Session,
  User,
} from '../models/index.js';
import { HttpError, badRequest } from '../lib/errors.js';
import { checkEmailCode, issueEmailCode } from '../lib/emailCodes.js';
import { verifyEmailMail, type Mailer } from '../lib/mailer.js';
import { PARENT_UNLOCK_MS, destroySession } from '../lib/session.js';
import { hmac, safeEqualHex } from '../lib/crypto.js';

const accountRoutes: FastifyPluginAsyncZod<{ config: AppConfig; mailer: Mailer }> = async (
  app,
  { config, mailer },
) => {
  // Everything here is parent area, except entering / locking the PIN itself.
  app.addHook('preHandler', async (req, reply) => {
    if ((req.routeOptions.config as { parentLockFree?: boolean }).parentLockFree) {
      return app.requireAuth(req, reply);
    }
    return app.requireParent(req, reply);
  });

  // ------------------------------------------------------------- parent PIN
  const pinHash = (userId: Types.ObjectId, pin: string) =>
    hmac(config.AUTH_SECRET, `parent-pin:${userId.toString()}:${pin}`);
  const unlock = (sessionId: Types.ObjectId, until: Date | null) =>
    Session.updateOne({ _id: sessionId }, { parentUnlockedUntil: until });

  app.put('/pin', { schema: { body: parentPinSchema } }, async (req, reply) => {
    const { user, sessionId } = req.auth!;
    await User.updateOne({ _id: user._id }, { parentPinHash: pinHash(user._id, req.body.pin) });
    await unlock(sessionId, new Date(Date.now() + PARENT_UNLOCK_MS));
    return reply.code(204).send();
  });

  app.delete('/pin', async (req, reply) => {
    await User.updateOne({ _id: req.auth!.user._id }, { parentPinHash: null });
    return reply.code(204).send();
  });

  app.post(
    '/pin/verify',
    {
      schema: { body: parentPinSchema },
      config: {
        parentLockFree: true,
        // 4 digits are guessable by trying – keep it slow (per account)
        rateLimit: {
          max: 5,
          timeWindow: '5 minutes',
          hook: 'preHandler', // after the session is known → per account, not per IP
          keyGenerator: (req) => `pin:${req.auth?.user._id.toString() ?? req.ip}`,
        },
      },
    },
    async (req) => {
      const { user, sessionId } = req.auth!;
      if (!user.parentPinHash) return { unlockedUntil: null };
      if (!safeEqualHex(user.parentPinHash, pinHash(user._id, req.body.pin))) {
        throw new HttpError(403, 'PIN_WRONG');
      }
      const until = new Date(Date.now() + PARENT_UNLOCK_MS);
      await unlock(sessionId, until);
      return { unlockedUntil: until.toISOString() };
    },
  );

  app.post('/pin/lock', { config: { parentLockFree: true } }, async (req, reply) => {
    await unlock(req.auth!.sessionId, null);
    return reply.code(204).send();
  });

  // -------------------------------------------- change the e-mail address
  app.post(
    '/email/request',
    {
      schema: { body: emailRequestSchema },
      config: { rateLimit: { max: 5, timeWindow: '10 minutes' } },
    },
    async (req, reply) => {
      const userId = req.auth!.user._id;
      const taken = await User.exists({ email: req.body.email, _id: { $ne: userId } });
      if (taken) throw new HttpError(409, 'EMAIL_IN_USE');
      const code = await issueEmailCode(config, {
        email: req.body.email,
        purpose: 'verify-email',
        userId,
      });
      if (!code) throw new HttpError(429, 'TOO_MANY_CODES');
      await mailer.send(verifyEmailMail(req.body.email, code));
      return reply.code(204).send();
    },
  );

  app.post(
    '/email/verify',
    {
      schema: { body: accountEmailVerifySchema },
      config: { rateLimit: { max: 10, timeWindow: '10 minutes' } },
    },
    async (req) => {
      const userId = req.auth!.user._id;
      const pending = await EmailCode.findOne({
        userId,
        purpose: 'verify-email',
        expiresAt: { $gt: new Date() },
      }).sort({ expiresAt: -1 });
      if (!pending) throw badRequest('EMAIL_CODE_INVALID');
      await checkEmailCode(config, {
        email: pending.email,
        purpose: 'verify-email',
        code: req.body.code,
        consume: true,
        userId,
      });
      try {
        await User.updateOne({ _id: userId }, { email: pending.email });
      } catch {
        throw new HttpError(409, 'EMAIL_IN_USE');
      }
      return { email: pending.email };
    },
  );

  // ------------------------------------------------------------ display name
  app.patch('/', { schema: { body: accountUpdateSchema } }, async (req) => {
    const { displayName } = req.body;
    await User.updateOne({ _id: req.auth!.user._id }, { displayName });
    return { displayName };
  });

  // ------------------------------------------------- delete account entirely
  app.delete('/', async (req, reply) => {
    const userId = req.auth!.user._id;
    const profileIds = (await Profile.find({ userId }, { _id: 1 }).lean()).map((p) => p._id);
    await Promise.all([
      LessonProgress.deleteMany({ profileId: { $in: profileIds } }),
      DailyActivity.deleteMany({ profileId: { $in: profileIds } }),
      Profile.deleteMany({ userId }),
      Passkey.deleteMany({ userId }),
      EmailCode.deleteMany({ userId }),
      Session.deleteMany({ userId }),
    ]);
    await User.deleteOne({ _id: userId });
    await destroySession(req, reply, config);
    return reply.code(204).send();
  });
};

export default accountRoutes;
