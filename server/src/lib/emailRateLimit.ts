import type { FastifyInstance, FastifyRequest } from 'fastify';
import { HttpError } from './errors.js';

const WINDOW = '10 minutes';
const LOOPBACK = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];

/**
 * Two limits for the e-mail code endpoints:
 * - per address and IP (route config) — protects a single inbox / code,
 * - per IP across all addresses (checked in the handler) — stops spraying many
 *   addresses, but is loose enough for a family or classroom behind one IP.
 * Codes themselves are additionally limited (3 active per address, 5 attempts each).
 * `createRateLimit` is absent when rate limiting is disabled (tests).
 */
export function emailRateLimit(
  app: FastifyInstance,
  name: string,
  {
    perAddress,
    perIp,
    exemptLoopback = false,
  }: { perAddress: number; perIp: number; exemptLoopback?: boolean },
) {
  // Development only: requests from this machine (E2E runs) are not limited.
  // (`allowList` as an array is compared with the generated key, so use a function.)
  const allowList = (req: FastifyRequest) => exemptLoopback && LOOPBACK.includes(req.ip);
  const ipLimit = app.hasDecorator('createRateLimit')
    ? app.createRateLimit({
        max: perIp,
        timeWindow: WINDOW,
        allowList,
        keyGenerator: (req) => `${name}:${req.ip}`,
      })
    : null;

  return {
    routeConfig: {
      rateLimit: {
        max: perAddress,
        timeWindow: WINDOW,
        hook: 'preHandler' as const, // after validation → the normalised address is available
        allowList,
        keyGenerator: (req: FastifyRequest) =>
          `${name}:${req.ip}|${(req.body as { email?: string }).email ?? ''}`,
      },
    },
    async checkIp(req: FastifyRequest) {
      if (!ipLimit) return;
      const res = await ipLimit(req); // `isAllowed` means allow-listed, not "under the limit"
      if (!res.isAllowed && res.isExceeded) throw new HttpError(429, 'RATE_LIMITED');
    },
  };
}
