import { localIsoDate } from '@klavio/shared';
import { ApiError } from '../api/client';
import { endpoints } from '../api/endpoints';
import { isTooOld, readQueue, writeQueue, type QueuedResult } from './queue';

let running = false;

function remove(item: QueuedResult) {
  writeQueue(readQueue().filter((q) => q.id !== item.id));
}

/** Is it worth trying again later (no connection, logged out, server busy)? */
function retryLater(err: unknown): boolean {
  return (
    err instanceof ApiError &&
    (err.code === 'NETWORK' || err.status === 401 || err.status === 429 || err.status >= 500)
  );
}

/**
 * Sends results played offline, oldest first. Results of other profiles of the
 * same account are sent by switching the session's profile briefly; the active
 * one is restored afterwards. Returns how many were saved.
 */
export async function flushQueue(userId: string, activeProfileId: string | null): Promise<number> {
  if (running) return 0;
  running = true;
  let synced = 0;
  let selected = activeProfileId;
  try {
    const today = localIsoDate();
    const mine = readQueue()
      .filter((q) => q.userId === userId)
      .sort((a, b) => a.queuedAt - b.queuedAt);
    for (const item of mine) {
      if (isTooOld(item, today)) {
        remove(item);
        continue;
      }
      try {
        if (selected !== item.profileId) {
          await endpoints.selectProfile(item.profileId);
          selected = item.profileId;
        }
        await endpoints.completeLesson(item.lessonId, {
          mistakes: item.mistakes,
          durationSec: item.durationSec,
          localDate: item.localDate,
        });
        remove(item);
        synced++;
      } catch (err) {
        if (retryLater(err)) break;
        remove(item); // rejected for good (e.g. profile deleted) – don't retry forever
      }
    }
  } finally {
    if (activeProfileId && selected !== activeProfileId) {
      await endpoints.selectProfile(activeProfileId).catch(() => undefined);
    }
    running = false;
  }
  return synced;
}

export function hasQueued(userId: string): boolean {
  return readQueue().some((q) => q.userId === userId);
}
