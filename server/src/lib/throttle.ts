import { AuthThrottle } from '../models/index.js';

/**
 * Locks a key (an e-mail address for login codes, an account for the parent
 * PIN) after repeated failures – independent of the IP address, so spreading
 * guesses over many addresses doesn't help. Counts are kept in the database.
 */
export interface ThrottlePolicy {
  /** failures before the first lock */
  threshold: number;
  /** length of the first lock; every further `threshold` failures double it */
  lockMs: number;
  /** longest lock */
  maxLockMs: number;
}

/** Failures are forgotten one day after the last one. */
const MEMORY_MS = 24 * 60 * 60 * 1000;

function lockMs(failures: number, p: ThrottlePolicy): number {
  if (failures < p.threshold) return 0;
  const step = Math.floor(failures / p.threshold) - 1;
  return Math.min(p.maxLockMs, p.lockMs * 2 ** step);
}

/** Milliseconds until the key may try again (0 = not locked). */
export async function lockedFor(key: string, p: ThrottlePolicy): Promise<number> {
  const doc = await AuthThrottle.findById(key).lean();
  if (!doc) return 0;
  const until = doc.lastFailureAt.getTime() + lockMs(doc.failures, p);
  return Math.max(0, until - Date.now());
}

/** Counts a failure (atomically). */
export async function recordFailure(key: string): Promise<void> {
  const now = new Date();
  await AuthThrottle.updateOne(
    { _id: key },
    { $inc: { failures: 1 }, $set: { lastFailureAt: now, expiresAt: new Date(+now + MEMORY_MS) } },
    { upsert: true },
  );
}

/**
 * Starts a guess atomically: counts it as a failure right away (a success
 * clears the count afterwards with `clearFailures`) and decides on the state
 * the increment found – so parallel guesses can't all slip through before the
 * first failure is written. Returns false while the key is locked (the guess
 * is then not counted).
 */
export async function claimAttempt(key: string, p: ThrottlePolicy): Promise<boolean> {
  // cheap check first: a locked key doesn't touch the count
  if ((await lockedFor(key, p)) > 0) return false;
  const now = new Date();
  const count = () =>
    AuthThrottle.findOneAndUpdate(
      { _id: key },
      {
        $inc: { failures: 1 },
        $set: { lastFailureAt: now, expiresAt: new Date(+now + MEMORY_MS) },
      },
      { upsert: true, returnDocument: 'before' },
    ).lean();
  // two first guesses at once may both try to create the entry: the loser counts again
  const before = await count().catch((err: unknown) => {
    if ((err as { code?: number }).code === 11000) return count();
    throw err;
  });
  if (!before) return true;
  const until = before.lastFailureAt.getTime() + lockMs(before.failures, p);
  if (until <= now.getTime()) return true;
  // a parallel guess got there first and locked the key: this one doesn't count
  await AuthThrottle.updateOne({ _id: key, failures: { $gt: 0 } }, { $inc: { failures: -1 } });
  return false;
}

/** A success clears the count. */
export async function clearFailures(key: string): Promise<void> {
  await AuthThrottle.deleteOne({ _id: key });
}
