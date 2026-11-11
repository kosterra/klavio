import { localIsoDate, type LessonResultDto } from '@klavio/shared';
import { ApiError, isTransient } from '../api/client';
import { endpoints } from '../api/endpoints';
import { isTooOld, readQueue, writeQueue, type QueuedResult } from './queue';

function remove(item: QueuedResult) {
  writeQueue(readQueue().filter((q) => q.id !== item.id));
}

/**
 * Worth trying again later: no connection, server busy, logged out (the result
 * waits for the next login), or the same result still being saved.
 */
function retryLater(err: unknown): boolean {
  return (
    isTransient(err) ||
    (err instanceof ApiError &&
      (err.status === 401 || (err.status === 409 && err.code === 'RESULT_IN_PROGRESS')))
  );
}

export interface FlushOutcome {
  /** how many results were saved */
  synced: number;
  /** the server's answer per saved result (by its id) */
  saved: Record<string, LessonResultDto>;
  /** results the server refused for good (removed from the queue) */
  refused: Record<string, ApiError>;
  /** why sending stopped early (the rest stays queued), if it did */
  stoppedBy: ApiError | null;
}

let chain: Promise<unknown> = Promise.resolve();

/**
 * Sends the account's waiting results, oldest first – a lesson only counts
 * after the ones played before it. Each result names its profile, so the
 * session's profile never changes. Calls run one after the other.
 */
export function flushQueue(userId: string): Promise<FlushOutcome> {
  const run = chain.then(() => sendAll(userId));
  chain = run.catch(() => undefined);
  return run;
}

async function sendAll(userId: string): Promise<FlushOutcome> {
  const out: FlushOutcome = { synced: 0, saved: {}, refused: {}, stoppedBy: null };
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
      out.saved[item.id] = await endpoints.completeLesson(item.lessonId, {
        mistakes: item.mistakes,
        durationSec: item.durationSec,
        localDate: item.localDate,
        profileId: item.profileId,
        resultId: item.id,
      });
      remove(item);
      out.synced++;
    } catch (err) {
      if (retryLater(err)) {
        out.stoppedBy = err as ApiError;
        break;
      }
      remove(item); // refused for good (e.g. profile deleted) – don't retry forever
      out.refused[item.id] = err instanceof ApiError ? err : new ApiError(0, 'UNKNOWN');
    }
  }
  return out;
}

export function hasQueued(userId: string): boolean {
  return readQueue().some((q) => q.userId === userId);
}
