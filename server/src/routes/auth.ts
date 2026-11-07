import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import {
  registerOptionsRequestSchema,
  recoveryLoginSchema,
  webauthnVerifyRequestSchema,
  type MeResponse,
} from '@klavio/shared';
import type { AppConfig } from '../config.js';
import { Passkey, User } from '../models/index.js';
import { consumeChallenge, storeChallenge } from '../lib/challenge.js';
import { randomToken } from '../lib/crypto.js';
import { badRequest } from '../lib/errors.js';
import { generateRecoveryCodes, hashRecoveryCode } from '../lib/recoveryCodes.js';
import { createSession, destroySession } from '../lib/session.js';
import { webauthn } from '../lib/webauthn.js';

export const authRateLimit = { max: 20, timeWindow: '1 minute' };

const authRoutes: FastifyPluginAsyncZod<{ config: AppConfig }> = async (app, { config }) => {
  // ---------------------------------------------------------------- register
  app.post(
    '/register/options',
    { schema: { body: registerOptionsRequestSchema }, config: { rateLimit: authRateLimit } },
    async (req, reply) => {
      const webauthnUserId = randomToken(32);
      const options = await webauthn.registrationOptions(config, {
        webauthnUserId,
        displayName: req.body.displayName,
      });
      await storeChallenge(config, reply, {
        challenge: options.challenge,
        purpose: 'register',
        webauthnUserId,
        displayName: req.body.displayName,
      });
      return options;
    },
  );

  app.post(
    '/register/verify',
    { schema: { body: webauthnVerifyRequestSchema }, config: { rateLimit: authRateLimit } },
    async (req, reply) => {
      const ch = await consumeChallenge(config, req, reply, 'register');
      const cred = await webauthn.verifyRegistration(config, req.body.response, ch.challenge);
      if (await Passkey.exists({ credentialId: cred.credentialId })) {
        throw badRequest('PASSKEY_ALREADY_REGISTERED');
      }
      const recovery = generateRecoveryCodes(config.AUTH_SECRET);
      const user = await User.create({
        displayName: ch.displayName!,
        webauthnUserId: ch.webauthnUserId!,
        recoveryCodeHashes: recovery.hashes,
      });
      await Passkey.create({
        userId: user._id,
        credentialId: cred.credentialId,
        publicKey: cred.publicKey,
        counter: cred.counter,
        transports: cred.transports,
        deviceType: cred.deviceType,
        backedUp: cred.backedUp,
        name: cred.providerName ?? 'Passkey',
        lastUsedAt: new Date(),
      });
      await createSession(config, req, reply, user._id);
      return { recoveryCodes: recovery.display };
    },
  );

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

  // ---------------------------------------------------------------- recovery
  app.post(
    '/recovery',
    {
      schema: { body: recoveryLoginSchema },
      config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
    },
    async (req, reply) => {
      const hash = hashRecoveryCode(config.AUTH_SECRET, req.body.code);
      // atomically consume the code so it can only be used once
      const user = await User.findOneAndUpdate(
        { recoveryCodeHashes: hash },
        { $pull: { recoveryCodeHashes: hash } },
        { returnDocument: 'after' },
      );
      if (!user) throw badRequest('RECOVERY_CODE_INVALID');
      await createSession(config, req, reply, user._id);
      return { ok: true, recoveryCodesRemaining: user.recoveryCodeHashes.length };
    },
  );

  // ------------------------------------------------------------------ session
  app.post('/logout', async (req, reply) => {
    await destroySession(req, reply, config);
    return { ok: true };
  });

  app.get('/me', { preHandler: app.requireAuth }, async (req): Promise<MeResponse> => {
    const { user, activeProfileId } = req.auth!;
    return {
      user: {
        id: user._id.toString(),
        displayName: user.displayName,
        email: user.email ?? null,
        role: user.role as MeResponse['user']['role'],
        recoveryCodesRemaining: user.recoveryCodeHashes.length,
      },
      activeProfileId: activeProfileId?.toString() ?? null,
    };
  });
};

export default authRoutes;
