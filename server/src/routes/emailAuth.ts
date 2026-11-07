import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { emailRequestSchema, emailVerifySchema } from '@klavio/shared';
import type { AppConfig } from '../config.js';
import { User } from '../models/index.js';
import { HttpError } from '../lib/errors.js';
import { issueEmailCode, checkEmailCode } from '../lib/emailCodes.js';
import { loginCodeMail, type Mailer } from '../lib/mailer.js';
import { randomToken } from '../lib/crypto.js';
import { createSession } from '../lib/session.js';
import { getSettings } from '../lib/settings.js';
import { emailRateLimit } from '../lib/emailRateLimit.js';

/**
 * Sign-up and passwordless login with a 6-digit one-time e-mail code.
 * Every account is created here; passkeys are added later in the account settings.
 * A code (not a magic link) is used on purpose: on iOS a link opens Safari,
 * not the installed PWA, so the session cookie would land in the wrong place.
 * Admins can close registration; existing accounts can always log in.
 */
const emailAuthRoutes: FastifyPluginAsyncZod<{ config: AppConfig; mailer: Mailer }> = async (
  app,
  { config, mailer },
) => {
  const registrationOpen = async () => (await getSettings(config)).registrationOpen;

  const requestLimit = emailRateLimit(app, 'email-request', { perAddress: 5, perIp: 30 });
  const verifyLimit = emailRateLimit(app, 'email-verify', { perAddress: 10, perIp: 60 });

  app.post(
    '/request',
    {
      schema: { body: emailRequestSchema },
      config: requestLimit.routeConfig,
    },
    async (req, reply) => {
      await requestLimit.checkIp(req);
      const { email } = req.body;
      // Always 204 — never reveal whether an account exists or a mail was throttled.
      // With registration closed, unknown addresses silently get no mail.
      if (!(await User.exists({ email })) && !(await registrationOpen())) {
        return reply.code(204).send();
      }
      const code = await issueEmailCode(config, { email, purpose: 'login' });
      if (code) await mailer.send(loginCodeMail(email, code));
      return reply.code(204).send();
    },
  );

  app.post(
    '/verify',
    {
      schema: { body: emailVerifySchema },
      config: verifyLimit.routeConfig,
    },
    async (req, reply) => {
      await verifyLimit.checkIp(req);
      const { email, code, displayName } = req.body;
      const existing = await User.findOne({ email });

      if (!existing) {
        // Check the code before anything else so the response never reveals
        // whether an address has an account. Not consumed yet: the client may
        // still have to ask for a name and retry.
        await checkEmailCode(config, { email, purpose: 'login', code, consume: false });
        if (!(await registrationOpen())) throw new HttpError(403, 'REGISTRATION_CLOSED');
        if (!displayName) return { status: 'needs-display-name' as const };
      }

      await checkEmailCode(config, { email, purpose: 'login', code, consume: true });

      if (existing) {
        await createSession(config, req, reply, existing._id);
        return { status: 'ok' as const };
      }

      let user;
      try {
        user = await User.create({ displayName, email, webauthnUserId: randomToken(32) });
      } catch {
        // Lost a race against a parallel sign-up with the same address.
        throw new HttpError(409, 'EMAIL_IN_USE');
      }
      await createSession(config, req, reply, user._id);
      return { status: 'created' as const };
    },
  );
};

export default emailAuthRoutes;
