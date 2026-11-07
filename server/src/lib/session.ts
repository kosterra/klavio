import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Types } from 'mongoose';
import type { AppConfig } from '../config.js';
import { Session } from '../models/index.js';
import { randomToken, sha256 } from './crypto.js';

export const SESSION_COOKIE = 'klavio_sid';
export const CHALLENGE_COOKIE = 'klavio_ch';

export function cookieBase(config: AppConfig) {
  return {
    path: '/api',
    httpOnly: true,
    secure: config.COOKIE_SECURE,
    sameSite: 'lax' as const,
  };
}

export async function createSession(
  config: AppConfig,
  req: FastifyRequest,
  reply: FastifyReply,
  userId: Types.ObjectId,
): Promise<void> {
  // Rotate: a login always replaces any session the browser already had.
  await destroySession(req, reply, config);
  const token = randomToken(32);
  const maxAge = config.SESSION_TTL_DAYS * 24 * 60 * 60;
  await Session.create({
    tokenHash: sha256(token),
    userId,
    expiresAt: new Date(Date.now() + maxAge * 1000),
    userAgent: (req.headers['user-agent'] ?? '').slice(0, 300),
  });
  reply.setCookie(SESSION_COOKIE, token, { ...cookieBase(config), maxAge });
}

export async function destroySession(
  req: FastifyRequest,
  reply: FastifyReply,
  config: AppConfig,
): Promise<void> {
  const token = req.cookies[SESSION_COOKIE];
  if (token) await Session.deleteOne({ tokenHash: sha256(token) });
  reply.clearCookie(SESSION_COOKIE, cookieBase(config));
}

export async function findSession(token: string | undefined) {
  if (!token) return null;
  const session = await Session.findOne({
    tokenHash: sha256(token),
    expiresAt: { $gt: new Date() },
  });
  return session;
}
