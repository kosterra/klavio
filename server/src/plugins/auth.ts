import fp from 'fastify-plugin';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Types } from 'mongoose';
import { User, type UserDoc } from '../models/index.js';
import { findSession, SESSION_COOKIE } from '../lib/session.js';
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

export default fp(async (app) => {
  app.decorateRequest('auth', null);

  app.addHook('onRequest', async (req) => {
    const session = await findSession(req.cookies[SESSION_COOKIE]);
    if (!session) return;
    const user = await User.findById(session.userId).lean<UserDoc>();
    if (!user) return;
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
