import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { passkeyRenameSchema, webauthnVerifyRequestSchema, type PasskeyDto } from '@klavio/shared';
import type { AppConfig } from '../config.js';
import { Passkey } from '../models/index.js';
import { consumeChallenge, storeChallenge } from '../lib/challenge.js';
import { badRequest, notFound } from '../lib/errors.js';
import { webauthn } from '../lib/webauthn.js';

const idParams = z.object({ id: z.string().regex(/^[a-f0-9]{24}$/) });

function toDto(p: {
  _id: { toString(): string };
  name: string;
  createdAt: Date;
  lastUsedAt?: Date | null;
  backedUp: boolean;
  deviceType: string;
}): PasskeyDto {
  return {
    id: p._id.toString(),
    name: p.name,
    createdAt: p.createdAt.toISOString(),
    lastUsedAt: p.lastUsedAt?.toISOString() ?? null,
    backedUp: p.backedUp,
    deviceType: p.deviceType,
  };
}

/** Manage the passkeys of the logged-in account (list, add, rename, delete). */
const passkeyRoutes: FastifyPluginAsyncZod<{ config: AppConfig }> = async (app, { config }) => {
  app.addHook('preHandler', app.requireAuth);

  app.get('/', async (req) => {
    const list = await Passkey.find({ userId: req.auth!.user._id }).sort({ createdAt: 1 }).lean();
    return list.map(toDto);
  });

  app.post('/options', async (req, reply) => {
    const user = req.auth!.user;
    const existing = await Passkey.find(
      { userId: user._id },
      { credentialId: 1, transports: 1 },
    ).lean();
    const options = await webauthn.registrationOptions(
      config,
      { webauthnUserId: user.webauthnUserId, displayName: user.displayName },
      existing,
    );
    await storeChallenge(config, reply, {
      challenge: options.challenge,
      purpose: 'add-passkey',
      userId: user._id,
    });
    return options;
  });

  app.post('/verify', { schema: { body: webauthnVerifyRequestSchema } }, async (req, reply) => {
    const ch = await consumeChallenge(config, req, reply, 'add-passkey');
    if (!ch.userId?.equals(req.auth!.user._id)) throw badRequest('CHALLENGE_INVALID');
    const cred = await webauthn.verifyRegistration(config, req.body.response, ch.challenge);
    if (await Passkey.exists({ credentialId: cred.credentialId })) {
      throw badRequest('PASSKEY_ALREADY_REGISTERED');
    }
    const created = await Passkey.create({
      userId: req.auth!.user._id,
      credentialId: cred.credentialId,
      publicKey: cred.publicKey,
      counter: cred.counter,
      transports: cred.transports,
      deviceType: cred.deviceType,
      backedUp: cred.backedUp,
      name: cred.providerName ?? 'Passkey',
    });
    return toDto(created);
  });

  app.patch('/:id', { schema: { params: idParams, body: passkeyRenameSchema } }, async (req) => {
    const updated = await Passkey.findOneAndUpdate(
      { _id: req.params.id, userId: req.auth!.user._id },
      { name: req.body.name },
      { returnDocument: 'after' },
    ).lean();
    if (!updated) throw notFound();
    return toDto(updated);
  });

  app.delete('/:id', { schema: { params: idParams } }, async (req, reply) => {
    const userId = req.auth!.user._id;
    const passkey = await Passkey.findOne({ _id: req.params.id, userId });
    if (!passkey) throw notFound();
    // Every account keeps its verified e-mail as login, so even the last passkey may go.
    await passkey.deleteOne();
    return reply.code(204).send();
  });
};

export default passkeyRoutes;
