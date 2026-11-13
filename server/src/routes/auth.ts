import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { webauthnVerifyRequestSchema, type MeResponse } from '@klavio/shared';
import type { AppConfig } from '../config.js';
import { Passkey } from '../models/index.js';
import { consumeChallenge, storeChallenge } from '../lib/challenge.js';
import { badRequest } from '../lib/errors.js';
import { createSession, destroySession } from '../lib/session.js';
import { webauthn } from '../lib/webauthn.js';

export const authRateLimit = { max: 20, timeWindow: '1 minute' };

/**
 * Passkey login and session endpoints. Accounts are created via e-mail code
 * (see emailAuth.ts); passkeys are added afterwards under /api/passkeys.
 */
const authRoutes: FastifyPluginAsyncZod<{ config: AppConfig }> = async (app, { config }) => {
  // ------------------------------------------------------------------- login
  app.post('/login/options', { config: { rateLimit: authRateLimit } }, async (_req, reply) => {
    const options = await webauthn.authenticationOptions(config);
    await storeChallenge(config, reply, { challenge: options.challenge, purpose: 'login' });
    return options;
  });

  app.post(
    '/login/verify',
    { schema: { body: webauthnVerifyRequestSchema }, config: { rateLimit: authRateLimit } },
    async (req, reply) => {
      const ch = await consumeChallenge(config, req, reply, 'login');
      const passkey = await Passkey.findOne({ credentialId: req.body.response.id });
      if (!passkey) throw badRequest('PASSKEY_UNKNOWN');
      const result = await webauthn.verifyAuthentication(config, req.body.response, ch.challenge, {
        credentialId: passkey.credentialId,
        publicKey: passkey.publicKey,
        counter: passkey.counter,
        transports: passkey.transports,
      });
      passkey.counter = result.newCounter;
      passkey.backedUp = result.backedUp;
      passkey.lastUsedAt = new Date();
      await passkey.save();
      await createSession(config, req, reply, passkey.userId);
      return { ok: true };
    },
  );

  // ------------------------------------------------------------------ session
  app.post('/logout', async (req, reply) => {
    await destroySession(req, reply, config);
    return { ok: true };
  });

  app.get('/me', { preHandler: app.requireAuth }, async (req): Promise<MeResponse> => {
    const { user, activeProfileId } = req.auth!;
    const passkeyCount = await Passkey.countDocuments({ userId: user._id });
    // (parent PIN state below)
    return {
      user: {
        id: user._id.toString(),
        displayName: user.displayName,
        email: user.email ?? null,
        role: user.role as MeResponse['user']['role'],
        passkeyCount,
        weeklyReport: !!user.weeklyReport,
        parentPin: {
          set: !!user.parentPinHash,
          passkeyEnabled: !!user.parentPasskeyUnlock,
          passkey: !!user.parentPinHash && !!user.parentPasskeyUnlock && passkeyCount > 0,
          unlockedUntil:
            user.parentPinHash && req.auth!.parentUnlocked
              ? (req.auth!.parentUnlockedUntil?.toISOString() ?? null)
              : null,
        },
      },
      activeProfileId: activeProfileId?.toString() ?? null,
      childLogin: req.auth!.childLogin,
    };
  });
};

export default authRoutes;
