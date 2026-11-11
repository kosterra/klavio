import fp from 'fastify-plugin';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Types } from 'mongoose';
import { Session, User, type UserDoc } from '../models/index.js';
import type { AppConfig } from '../config.js';
import { cookieBase, findSession, SESSION_COOKIE } from '../lib/session.js';
import { HttpError, forbidden, unauthorized } from '../lib/errors.js';

declare module 'fastify' {
  interface FastifyRequest {
    auth: {
      user: UserDoc;
      sessionId: Types.ObjectId;
      activeProfileId: Types.ObjectId | null;
      /** Until when the parent area is open in this session (null = locked). */
      parentUnlockedUntil: Date | null;
      /** No parent PIN set, or it was entered recently. */
      parentUnlocked: boolean;
    } | null;
  }
  interface FastifyInstance {
    requireAuth: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAdmin: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    /** Logged in and — if a parent PIN is set — the parent area is unlocked. */
    requireParent: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

/** A session in use is renewed (at most once a day): who practises keeps logged in. */
const RENEW_AFTER_MS = 24 * 60 * 60 * 1000;

export default fp<{ config: AppConfig }>(async (app, { config }) => {
  app.decorateRequest('auth', null);

  app.addHook('onRequest', async (req, reply) => {
    const token = req.cookies[SESSION_COOKIE];
    const session = await findSession(token);
    if (!session) return;
    const user = await User.findById(session.userId).lean<UserDoc>();
    if (!user) return;
    const ttlMs = config.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;
    if (session.expiresAt.getTime() - Date.now() < ttlMs - RENEW_AFTER_MS) {
      await Session.updateOne(
        { _id: session._id },
        { $set: { expiresAt: new Date(Date.now() + ttlMs) } },
      );
      reply.setCookie(SESSION_COOKIE, token!, { ...cookieBase(config), maxAge: ttlMs / 1000 });
    }
    // remember use (at most twice a day) – long-unused accounts may be deleted after a warning
    const last = user.lastActiveAt?.getTime() ?? 0;
    if (Date.now() - last > 12 * 60 * 60 * 1000 || user.inactiveWarnedAt) {
      await User.updateOne({ _id: user._id }, { lastActiveAt: new Date(), inactiveWarnedAt: null });
    }
    const until = session.parentUnlockedUntil ?? null;
    req.auth = {
      user,
      sessionId: session._id,
      activeProfileId: session.activeProfileId ?? null,
      parentUnlockedUntil: until,
      parentUnlocked: !user.parentPinHash || (!!until && until.getTime() > Date.now()),
    };
  });

  app.decorate('requireAuth', async (req: FastifyRequest) => {
    if (!req.auth) throw unauthorized();
  });

  app.decorate('requireParent', async (req: FastifyRequest) => {
    if (!req.auth) throw unauthorized();
    if (!req.auth.parentUnlocked) throw new HttpError(403, 'PARENT_LOCKED');
  });

  app.decorate('requireAdmin', async (req: FastifyRequest) => {
    if (!req.auth) throw unauthorized();
    if (req.auth.user.role !== 'admin') throw forbidden();
    if (!req.auth.parentUnlocked) throw new HttpError(403, 'PARENT_LOCKED');
  });
});
