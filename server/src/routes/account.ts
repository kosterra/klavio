import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { accountEmailVerifySchema, emailRequestSchema } from '@klavio/shared';
import type { AppConfig } from '../config.js';
import { EmailCode, Passkey, Profile, Session, User } from '../models/index.js';
import { HttpError, badRequest } from '../lib/errors.js';
import { checkEmailCode, issueEmailCode } from '../lib/emailCodes.js';
import { verifyEmailMail, type Mailer } from '../lib/mailer.js';
import { destroySession } from '../lib/session.js';

const accountRoutes: FastifyPluginAsyncZod<{ config: AppConfig; mailer: Mailer }> = async (
  app,
  { config, mailer },
) => {
  app.addHook('preHandler', app.requireAuth);

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

  // ------------------------------------------------- delete account entirely
  app.delete('/', async (req, reply) => {
    const userId = req.auth!.user._id;
    await Promise.all([
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
