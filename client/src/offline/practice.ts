import { addDays, localIsoDate } from '@klavio/shared';
import { ApiError, isTransient } from '../api/client';
import { endpoints } from '../api/endpoints';
import { KEYS, readJson, writeJson } from './storage';

/** Practice time counted on this device, not yet confirmed by the server. */
export interface PracticePiece {
  id: string;
  userId: string;
  profileId: string;
  localDate: string;
  seconds: number;
}

/** The server accepts days up to this far back (like lesson results). */
const MAX_AGE_DAYS = 14;

export function readPractice(): PracticePiece[] {
  return readJson<PracticePiece[]>(KEYS.practice) ?? [];
}

function writePractice(items: PracticePiece[]): void {
  writeJson(KEYS.practice, items);
}

/** Keeps practice time on the device until it is sent. */
export function addPractice(piece: Omit<PracticePiece, 'id'>): void {
  if (piece.seconds < 1) return;
  writePractice([...readPractice(), { ...piece, id: crypto.randomUUID() }]);
}

let chain: Promise<unknown> = Promise.resolve();

/**
 * Sends the account's practice time, one piece after the other. A piece the
 * server confirmed (or refused for good) leaves the device; without a
 * connection the rest waits for the next try.
 */
export function flushPractice(userId: string): Promise<void> {
  const run = chain.then(() => sendAll(userId));
  chain = run.catch(() => undefined);
  return run;
}

async function sendAll(userId: string): Promise<void> {
  const oldest = addDays(localIsoDate(), -MAX_AGE_DAYS);
  for (const piece of readPractice().filter((p) => p.userId === userId)) {
    const remove = () => writePractice(readPractice().filter((p) => p.id !== piece.id));
    if (piece.localDate < oldest) {
      remove();
      continue;
    }
    try {
      await endpoints.recordPractice({
        seconds: Math.min(3600, Math.round(piece.seconds)),
        localDate: piece.localDate,
        profileId: piece.profileId,
        pieceId: piece.id,
      });
      remove();
    } catch (err) {
      // no connection, server busy, logged out: try again later
      if (isTransient(err) || (err instanceof ApiError && err.status === 401)) return;
      remove(); // refused for good (e.g. profile deleted)
    }
  }
}
