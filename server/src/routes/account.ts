import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import type { Types } from 'mongoose';
import {
  accountEmailVerifySchema,
  accountUpdateSchema,
  emailRequestSchema,
  parentPasskeySettingSchema,
  parentPinSchema,
  webauthnVerifyRequestSchema,
} from '@klavio/shared';
import type { AppConfig } from '../config.js';
import { EmailCode, Passkey, Session, User } from '../models/index.js';
import { HttpError, badRequest } from '../lib/errors.js';
import { checkEmailCode, issueEmailCode } from '../lib/emailCodes.js';
import type { Mailer } from '../lib/mailer.js';
import { codeMail } from '../lib/mailTemplates.js';
import { deleteAccount } from '../lib/accounts.js';
import { exportAccount } from '../lib/dataExport.js';
import { PARENT_UNLOCK_MS, destroySession } from '../lib/session.js';
import { hmac, safeEqualHex } from '../lib/crypto.js';
import { consumeChallenge, storeChallenge } from '../lib/challenge.js';
import { webauthn } from '../lib/webauthn.js';

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

  // ------------------------------------------- open the parent area with a passkey
  app.put('/pin/passkey', { schema: { body: parentPasskeySettingSchema } }, async (req, reply) => {
    await User.updateOne({ _id: req.auth!.user._id }, { parentPasskeyUnlock: req.body.enabled });
    return reply.code(204).send();
  });

  const passkeyUnlockAllowed = async (user: {
    _id: Types.ObjectId;
    parentPinHash?: string | null;
    parentPasskeyUnlock?: boolean | null;
  }) => {
    if (!user.parentPinHash || !user.parentPasskeyUnlock)
      throw new HttpError(403, 'PASSKEY_UNLOCK_OFF');
    const passkeys = await Passkey.find({ userId: user._id }).lean();
    if (!passkeys.length) throw new HttpError(403, 'PASSKEY_UNLOCK_OFF');
    return passkeys;
  };

  app.post(
    '/pin/passkey/options',
    { config: { parentLockFree: true, rateLimit: { max: 20, timeWindow: '5 minutes' } } },
    async (req, reply) => {
      const { user } = req.auth!;
      const passkeys = await passkeyUnlockAllowed(user);
      // only this account's passkeys, and the device must check who is there
      const options = await webauthn.authenticationOptions(
        config,
        passkeys.map((p) => ({ credentialId: p.credentialId, transports: p.transports ?? [] })),
      );
      await storeChallenge(config, reply, {
        challenge: options.challenge,
        purpose: 'parent-unlock',
        userId: user._id,
      });
      return options;
    },
  );

  app.post(
    '/pin/passkey/verify',
    {
      schema: { body: webauthnVerifyRequestSchema },
      config: { parentLockFree: true, rateLimit: { max: 20, timeWindow: '5 minutes' } },
    },
    async (req, reply) => {
      const { user, sessionId } = req.auth!;
      await passkeyUnlockAllowed(user);
      const ch = await consumeChallenge(config, req, reply, 'parent-unlock');
      if (!ch.userId || !ch.userId.equals(user._id)) throw new HttpError(403, 'PASSKEY_UNKNOWN');
      const passkey = await Passkey.findOne({
        credentialId: req.body.response.id,
        userId: user._id,
      });
      if (!passkey) throw new HttpError(403, 'PASSKEY_UNKNOWN');
      const result = await webauthn.verifyAuthentication(
        config,
        req.body.response,
        ch.challenge,
        {
          credentialId: passkey.credentialId,
          publicKey: passkey.publicKey,
          counter: passkey.counter,
          transports: passkey.transports,
        },
        true,
      );
      passkey.counter = result.newCounter;
      passkey.lastUsedAt = new Date();
      await passkey.save();
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
      await mailer.send(
        await codeMail(config, 'verify-email', req.body.email, code, req.body.lang),
      );
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
  /** Everything stored about the account, as one JSON file (right to data portability). */
  app.get('/export', async (req, reply) => {
    const data = await exportAccount(req.auth!.user._id);
    const day = new Date().toISOString().slice(0, 10);
    return reply
      .header('content-disposition', `attachment; filename="klavio-${day}.json"`)
      .header('cache-control', 'no-store')
      .type('application/json; charset=utf-8')
      .send(JSON.stringify(data, null, 2));
  });

  app.delete('/', async (req, reply) => {
    await deleteAccount(req.auth!.user._id);
    await destroySession(req, reply, config);
    return reply.code(204).send();
  });
};

export default accountRoutes;
