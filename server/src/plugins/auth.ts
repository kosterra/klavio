import fp from 'fastify-plugin';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Types } from 'mongoose';
import { User, type UserDoc } from '../models/index.js';
import { findSession, SESSION_COOKIE } from '../lib/session.js';
import { forbidden, unauthorized } from '../lib/errors.js';

declare module 'fastify' {
  interface FastifyRequest {
    auth: {
      user: UserDoc;
      sessionId: Types.ObjectId;
      activeProfileId: Types.ObjectId | null;
    } | null;
  }
  interface FastifyInstance {
    requireAuth: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAdmin: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export default fp(async (app) => {
  app.decorateRequest('auth', null);

  app.addHook('onRequest', async (req) => {
    const session = await findSession(req.cookies[SESSION_COOKIE]);
    if (!session) return;
    const user = await User.findById(session.userId).lean<UserDoc>();
    if (!user) return;
    req.auth = { user, sessionId: session._id, activeProfileId: session.activeProfileId ?? null };
  });

  app.decorate('requireAuth', async (req: FastifyRequest) => {
    if (!req.auth) throw unauthorized();
  });

  app.decorate('requireAdmin', async (req: FastifyRequest) => {
    if (!req.auth) throw unauthorized();
    if (req.auth.user.role !== 'admin') throw forbidden();
  });
});
