import {
  addDays,
  weekOf,
  findLesson,
  scoringTarget,
  starsFor,
  type LessonCompleteInput,
  type ProgressDto,
  applyCompletion,
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

export function enqueueResult(
  item: Omit<QueuedResult, 'id' | 'queuedAt' | 'resultId'>,
): QueuedResult {
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
  const weekDays = new Set(progress.weekDays ?? []);
  const monday = weekOf(progress.today.date);
  for (const q of queue) {
    if (q.profileId !== profileId) continue;
    const lesson = findLesson(q.lessonId);
    if (!lesson) continue;
    const stars = starsFor(scoringTarget(lesson.id), q.mistakes);
    lessons[q.lessonId] = applyCompletion(lessons[q.lessonId], stars, q.localDate).next;
    if (q.localDate === progress.today.date) seconds += q.durationSec;
    if (q.localDate >= monday && q.localDate <= progress.today.date) weekDays.add(q.localDate);
  }
  return {
    ...progress,
    lessons,
    today: { ...progress.today, seconds },
    weekDays: [...weekDays].sort(),
  };
}

/** The server accepts results up to this many days back (synced later). */
export const MAX_QUEUE_AGE_DAYS = 14;

export function isTooOld(item: QueuedResult, today: string): boolean {
  return item.localDate < addDays(today, -MAX_QUEUE_AGE_DAYS);
}
