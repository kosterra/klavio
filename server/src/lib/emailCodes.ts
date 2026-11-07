import type { Types } from 'mongoose';
import type { AppConfig } from '../config.js';
import { EmailCode } from '../models/index.js';
import { hmac, randomDigits, safeEqualHex } from './crypto.js';
import { badRequest } from './errors.js';

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
/** Max. codes per address and purpose inside one TTL window. */
const MAX_ACTIVE_CODES = 3;

type Purpose = 'login' | 'verify-email';

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
 * Verifies against the newest unexpired code. Wrong guesses count against it;
 * after MAX_ATTEMPTS the code is burned. Throws EMAIL_CODE_INVALID on any failure.
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
  const doc = await EmailCode.findOne(filter).sort({ expiresAt: -1 });
  if (!doc) throw badRequest('EMAIL_CODE_INVALID');
  if (doc.attempts >= MAX_ATTEMPTS) {
    await doc.deleteOne();
    throw badRequest('EMAIL_CODE_INVALID');
  }
  if (!safeEqualHex(doc.codeHash, hashCode(config, opts.email, opts.code))) {
    doc.attempts += 1;
    await doc.save();
    throw badRequest('EMAIL_CODE_INVALID');
  }
  if (opts.consume) await EmailCode.deleteMany({ email: opts.email, purpose: opts.purpose });
  return doc;
}
