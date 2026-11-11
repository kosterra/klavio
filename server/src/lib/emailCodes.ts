import type { Types } from 'mongoose';
import type { AppConfig } from '../config.js';
import { EmailCode } from '../models/index.js';
import { hmac, randomDigits, safeEqualHex } from './crypto.js';
import { badRequest, HttpError } from './errors.js';
import { clearFailures, lockedFor, recordFailure, type ThrottlePolicy } from './throttle.js';

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
/** Max. codes per address and purpose inside one TTL window (spent ones count too). */
const MAX_ACTIVE_CODES = 3;
/**
 * Per address, whatever the IP: 10 wrong codes lock the address for an hour,
 * every further 10 double it (at most a day). With 3 codes per 10 minutes
 * and 5 attempts each, guessing one of a million codes stays hopeless.
 */
export const CODE_THROTTLE: ThrottlePolicy = {
  threshold: 10,
  lockMs: 60 * 60 * 1000,
  maxLockMs: 24 * 60 * 60 * 1000,
};

type Purpose = 'login' | 'verify-email' | 'pin-reset';

const hashCode = (config: AppConfig, email: string, code: string) =>
  hmac(config.AUTH_SECRET, `email:${email}:${code}`);

/** Returns the plain code to send, or null when the address is throttled. */
export async function issueEmailCode(
  config: AppConfig,
  opts: { email: string; purpose: Purpose; userId?: Types.ObjectId },
): Promise<string | null> {
  const active = await EmailCode.countDocuments({
    email: opts.email,
    purpose: opts.purpose,
    expiresAt: { $gt: new Date() },
  });
  if (active >= MAX_ACTIVE_CODES) return null;
  const code = randomDigits(6);
  await EmailCode.create({
    ...opts,
    codeHash: hashCode(config, opts.email, code),
    expiresAt: new Date(Date.now() + CODE_TTL_MS),
  });
  return code;
}

/**
 * Verifies against the newest unexpired code that still has attempts left.
 * Every try counts against the code (spent codes stay until they expire, so
 * they still count towards MAX_ACTIVE_CODES); wrong ones also count against
 * the address (CODE_THROTTLE). Throws EMAIL_CODE_INVALID on any failure,
 * RATE_LIMITED while the address is locked.
 */
export async function checkEmailCode(
  config: AppConfig,
  opts: {
    email: string;
    purpose: Purpose;
    code: string;
    consume: boolean;
    userId?: Types.ObjectId;
  },
) {
  const filter = {
    email: opts.email,
    purpose: opts.purpose,
    expiresAt: { $gt: new Date() },
    ...(opts.userId ? { userId: opts.userId } : {}),
  };
  const throttleKey = `code:${opts.email}`;
  if ((await lockedFor(throttleKey, CODE_THROTTLE)) > 0) throw new HttpError(429, 'RATE_LIMITED');
  // count the attempt before comparing – atomically, so parallel guesses can't share one
  const doc = await EmailCode.findOneAndUpdate(
    { ...filter, attempts: { $lt: MAX_ATTEMPTS } },
    { $inc: { attempts: 1 } },
    { sort: { expiresAt: -1 }, new: true },
  );
  if (!doc || !safeEqualHex(doc.codeHash, hashCode(config, opts.email, opts.code))) {
    await recordFailure(throttleKey);
    throw badRequest('EMAIL_CODE_INVALID');
  }
  await clearFailures(throttleKey);
  if (opts.consume) await EmailCode.deleteMany({ email: opts.email, purpose: opts.purpose });
  return doc;
}
