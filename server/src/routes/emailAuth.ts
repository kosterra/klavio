import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { emailRequestSchema, emailVerifySchema } from '@klavio/shared';
import type { AppConfig } from '../config.js';
import { User } from '../models/index.js';
import { HttpError } from '../lib/errors.js';
import { issueEmailCode, checkEmailCode } from '../lib/emailCodes.js';
import { loginCodeMail, type Mailer } from '../lib/mailer.js';
import { randomToken } from '../lib/crypto.js';
import { generateRecoveryCodes } from '../lib/recoveryCodes.js';
import { createSession } from '../lib/session.js';
import { getSettings } from '../lib/settings.js';

/**
 * Passwordless e-mail login with a 6-digit one-time code.
 * A code (not a magic link) is used on purpose: on iOS a link opens Safari,
 * not the installed PWA, so the session cookie would land in the wrong place.
 * The whole feature can be switched off globally by admins.
 */
const emailAuthRoutes: FastifyPluginAsyncZod<{ config: AppConfig; mailer: Mailer }> = async (
  app,
  { config, mailer },
) => {
  app.addHook('preHandler', async () => {
    if (!(await getSettings(config)).emailLoginEnabled) {
      throw new HttpError(403, 'EMAIL_LOGIN_DISABLED');
    }
  });

  app.post(
    '/request',
    {
      schema: { body: emailRequestSchema },
      config: { rateLimit: { max: 5, timeWindow: '10 minutes' } },
    },
    async (req, reply) => {
      const code = await issueEmailCode(config, { email: req.body.email, purpose: 'login' });
      // Always 204 — never reveal whether an account exists or a mail was throttled.
      if (code) await mailer.send(loginCodeMail(req.body.email, code));
      return reply.code(204).send();
    },
  );

  app.post(
    '/verify',
    {
      schema: { body: emailVerifySchema },
      config: { rateLimit: { max: 10, timeWindow: '10 minutes' } },
    },
    async (req, reply) => {
      const { email, code, displayName } = req.body;
      const existing = await User.findOne({ email });

      if (!existing && !displayName) {
        // Code is checked but not consumed: the client asks for a name and retries.
        await checkEmailCode(config, { email, purpose: 'login', code, consume: false });
        return { status: 'needs-display-name' as const };
      }

      await checkEmailCode(config, { email, purpose: 'login', code, consume: true });

      if (existing) {
        await createSession(config, req, reply, existing._id);
        return { status: 'ok' as const };
      }

      const recovery = generateRecoveryCodes(config.AUTH_SECRET);
      const user = await User.create({
        displayName,
        email,
        webauthnUserId: randomToken(32),
        recoveryCodeHashes: recovery.hashes,
      });
      await createSession(config, req, reply, user._id);
      return { status: 'created' as const, recoveryCodes: recovery.display };
    },
  );
};

export default emailAuthRoutes;
