import Fastify, { type FastifyError } from 'fastify';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import {
  hasZodFastifySchemaValidationErrors,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import type { AppConfig } from './config.js';
import authPlugin from './plugins/auth.js';
import { HttpError } from './lib/errors.js';
import { createMailer, type Mailer } from './lib/mailer.js';
import authRoutes from './routes/auth.js';
import emailAuthRoutes from './routes/emailAuth.js';
import passkeyRoutes from './routes/passkeys.js';
import accountRoutes from './routes/account.js';
import profileRoutes from './routes/profiles.js';
import progressRoutes from './routes/progress.js';
import adminRoutes from './routes/admin.js';
import publicConfigRoutes from './routes/publicConfig.js';

export interface BuildOptions {
  config: AppConfig;
  mailer?: Mailer;
  rateLimit?: boolean;
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export async function buildApp({ config, mailer, rateLimit: withRateLimit = true }: BuildOptions) {
  const app = Fastify({
    logger: config.NODE_ENV === 'test' ? false : { level: config.LOG_LEVEL },
    trustProxy: config.TRUST_PROXY,
    bodyLimit: 64 * 1024,
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // API responses are JSON only → the strictest possible CSP.
  await app.register(helmet, {
    contentSecurityPolicy: {
      useDefaults: false,
      directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
    },
    crossOriginResourcePolicy: { policy: 'same-origin' },
  });
  await app.register(cookie);
  if (withRateLimit) {
    await app.register(rateLimit, { global: true, max: 300, timeWindow: '1 minute' });
  }

  // CSRF defence in depth (cookies are SameSite=Lax already): state-changing
  // requests must come from our own origin.
  app.addHook('onRequest', async (req) => {
    if (SAFE_METHODS.has(req.method)) return;
    if (req.headers.origin !== config.APP_ORIGIN) throw new HttpError(403, 'BAD_ORIGIN');
  });

  app.setErrorHandler((err: FastifyError, req, reply) => {
    if (err instanceof HttpError) {
      return reply.code(err.statusCode).send({ error: err.code });
    }
    if (hasZodFastifySchemaValidationErrors(err)) {
      return reply.code(400).send({
        error: 'VALIDATION',
        issues: err.validation.map((v) => ({ path: v.instancePath, message: v.message })),
      });
    }
    if (err.statusCode === 429) return reply.code(429).send({ error: 'RATE_LIMITED' });
    if (err.statusCode && err.statusCode < 500) {
      return reply.code(err.statusCode).send({ error: err.code ?? 'BAD_REQUEST' });
    }
    req.log.error(err);
    return reply.code(500).send({ error: 'INTERNAL' });
  });

  const resolvedMailer = mailer ?? createMailer(config, (m) => app.log.info(m));

  await app.register(authPlugin);
  await app.register(
    async (api) => {
      await api.register(publicConfigRoutes, { config });
      await api.register(authRoutes, { prefix: '/auth', config });
      await api.register(emailAuthRoutes, {
        prefix: '/auth/email',
        config,
        mailer: resolvedMailer,
      });
      await api.register(passkeyRoutes, { prefix: '/passkeys', config });
      await api.register(accountRoutes, { prefix: '/account', config, mailer: resolvedMailer });
      await api.register(profileRoutes, { prefix: '/profiles' });
      await api.register(progressRoutes, { prefix: '/progress' });
      await api.register(adminRoutes, { prefix: '/admin', config });
    },
    { prefix: '/api' },
  );

  return app;
}
