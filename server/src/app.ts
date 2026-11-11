import Fastify, { type FastifyError, type FastifyInstance } from 'fastify';
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
import { scheduleWeeklyReports } from './lib/weeklyReport.js';
import { scheduleReminders } from './lib/reminders.js';
import reminderRoutes from './routes/reminders.js';
import { registerWeb } from './plugins/web.js';
import { HttpError } from './lib/errors.js';
import { createMailer, type Mailer } from './lib/mailer.js';
import { scheduleRetention } from './lib/retention.js';
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
  /**
   * Runs right before the routes are registered – for plugins that have to see
   * every route (scripts/openapi.ts registers @fastify/swagger here).
   */
  beforeRoutes?: (app: FastifyInstance) => Promise<void>;
  /** background jobs (deleting long-inactive accounts) – only the real server */
  jobs?: boolean;
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export async function buildApp({
  config,
  mailer,
  rateLimit: withRateLimit = true,
  beforeRoutes,
  jobs = false,
}: BuildOptions) {
  const app = Fastify({
    logger:
      config.NODE_ENV === 'test'
        ? false
        : {
            level: config.LOG_LEVEL,
            // Data minimisation: no client IP addresses in the logs (rate limits
            // only keep them in memory for the time window).
            serializers: {
              req: (req: { method: string; url: string; id: string }) => ({
                id: req.id,
                method: req.method,
                url: req.url,
              }),
            },
          },
    // (the union of the parsed setting confuses the overloads of Fastify())
    trustProxy: config.TRUST_PROXY as boolean,
    bodyLimit: 64 * 1024,
    // slow or stalled clients don't hold connections open for ever
    connectionTimeout: 60_000,
    requestTimeout: 30_000,
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
    await app.register(rateLimit, {
      global: true,
      max: 300,
      timeWindow: '1 minute',
      // only the API: the app's own files (one page load fetches dozens) are not counted
      allowList: (req) => !req.url.startsWith('/api/'),
      // a client that hung up has no address any more – not a server error
      keyGenerator: (req) => req.ip ?? 'gone',
    });
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
  if (jobs) {
    const stop = scheduleRetention(config, resolvedMailer, app.log);
    const stopReports = scheduleWeeklyReports(config, resolvedMailer, app.log);
    const stopReminders = scheduleReminders(config, app.log);
    app.addHook('onClose', async () => {
      stop();
      stopReports();
      stopReminders();
    });
  }

  await app.register(authPlugin, { config });
  if (beforeRoutes) await beforeRoutes(app);
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
      await api.register(profileRoutes, { prefix: '/profiles', config });
      await api.register(progressRoutes, { prefix: '/progress' });
      await api.register(reminderRoutes, { prefix: '/reminders', config });
      await api.register(adminRoutes, { prefix: '/admin', config, mailer: resolvedMailer });
    },
    { prefix: '/api' },
  );

  // the Docker image: one server for app and API
  if (config.STATIC_DIR) await registerWeb(app, config, config.STATIC_DIR);

  return app;
}
