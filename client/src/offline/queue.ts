import {
  addDays,
  findLesson,
  lessonTargetCount,
  starsFor,
  type LessonCompleteInput,
  type ProgressDto,
} from '@klavio/shared';
import { KEYS, readJson, writeJson } from './storage';

/** A lesson result that could not be sent yet (offline). */
export interface QueuedResult extends LessonCompleteInput {
  id: string;
  userId: string;
  profileId: string;
  lessonId: string;
  queuedAt: number;
}

export function readQueue(): QueuedResult[] {
  return readJson<QueuedResult[]>(KEYS.queue) ?? [];
}

export function writeQueue(items: QueuedResult[]): void {
  writeJson(KEYS.queue, items);
}

export function enqueueResult(item: Omit<QueuedResult, 'id' | 'queuedAt'>): QueuedResult {
  const entry = { ...item, id: crypto.randomUUID(), queuedAt: Date.now() };
  writeQueue([...readQueue(), entry]);
  return entry;
}

/**
 * Progress as the learner should see it while offline: the last known server
 * state plus the results still waiting in the queue (stars by the same rules
 * the server uses).
 */
export function withQueuedResults(
  progress: ProgressDto,
  queue: QueuedResult[],
  profileId: string,
): ProgressDto {
  const lessons = { ...progress.lessons };
  let { seconds } = progress.today;
  for (const q of queue) {
    if (q.profileId !== profileId) continue;
    const lesson = findLesson(q.lessonId);
    if (!lesson) continue;
    const stars = starsFor(lessonTargetCount(lesson), q.mistakes);
    const prev = lessons[q.lessonId];
    lessons[q.lessonId] = {
      bestStars: Math.max(prev?.bestStars ?? 0, stars),
      completions: (prev?.completions ?? 0) + 1,
    };
    if (q.localDate === progress.today.date) seconds += q.durationSec;
  }
  return { ...progress, lessons, today: { ...progress.today, seconds } };
}

/** The server accepts results up to this many days back (synced later). */
export const MAX_QUEUE_AGE_DAYS = 14;

export function isTooOld(item: QueuedResult, today: string): boolean {
  return item.localDate < addDays(today, -MAX_QUEUE_AGE_DAYS);
}
