import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Types } from 'mongoose';
import type { AppConfig } from '../config.js';
import { AuthChallenge } from '../models/index.js';
import { randomToken, sha256 } from './crypto.js';
import { CHALLENGE_COOKIE, cookieBase } from './session.js';
import { badRequest } from './errors.js';

const CHALLENGE_TTL_MS = 5 * 60 * 1000;

type Purpose = 'login' | 'add-passkey';

export async function storeChallenge(
  config: AppConfig,
  reply: FastifyReply,
  data: {
    challenge: string;
    purpose: Purpose;
    userId?: Types.ObjectId;
  },
): Promise<void> {
  const token = randomToken(24);
  await AuthChallenge.create({
    ...data,
    tokenHash: sha256(token),
    expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
  });
  reply.setCookie(CHALLENGE_COOKIE, token, {
    ...cookieBase(config),
    maxAge: CHALLENGE_TTL_MS / 1000,
  });
}

/** Single use: the challenge is deleted as soon as it is read. */
export async function consumeChallenge(
  config: AppConfig,
  req: FastifyRequest,
  reply: FastifyReply,
  purpose: Purpose,
) {
  const token = req.cookies[CHALLENGE_COOKIE];
  reply.clearCookie(CHALLENGE_COOKIE, cookieBase(config));
  if (!token) throw badRequest('CHALLENGE_MISSING');
  const doc = await AuthChallenge.findOneAndDelete({ tokenHash: sha256(token) }).lean();
  if (!doc || doc.purpose !== purpose || doc.expiresAt.getTime() < Date.now()) {
    throw badRequest('CHALLENGE_INVALID');
  }
  return doc;
}
