import { LESSONS } from './curriculum.ts';
import { addDays } from './rewards.ts';
import type { LessonProgressDto } from '../schemas/progress.ts';

/**
 * Regular repetition, like flash cards: a lesson is due again after 1, 3, 7,
 * 14 and then every 30 days. A good review (2–3 stars) moves it on to the next,
 * longer step; a weak one (1 star) one step back.
 * Only the date of the last completion and the step are needed.
 */
export const REVIEW_INTERVALS = [1, 3, 7, 14, 30] as const;

/** Extra XP for reviewing a lesson that is due. */
export const REVIEW_BONUS_XP = 5;

/** The dashboard suggests at most this many reviews per day. */
export const MAX_REVIEWS_SHOWN = 3;

export function reviewDueDate(p: Pick<LessonProgressDto, 'lastDate' | 'box'>): string | null {
  if (!p.lastDate) return null;
  const step = REVIEW_INTERVALS[Math.min(Math.max(p.box, 0), REVIEW_INTERVALS.length - 1)]!;
  return addDays(p.lastDate, step);
}

export function isReviewDue(
  p: Pick<LessonProgressDto, 'lastDate' | 'box' | 'bestStars'> | undefined,
  today: string,
): boolean {
  if (!p || p.bestStars <= 0) return false;
  const due = reviewDueDate(p);
  return due !== null && today >= due;
}

/** Whole days between two ISO dates (b − a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

/**
 * The progress of a lesson after playing it once more, the same rules on the
 * server and on the device (offline). Late offline results never move the
 * date backwards.
 */
export function applyCompletion(
  previous: LessonProgressDto | undefined,
  stars: number,
  localDate: string,
): { next: LessonProgressDto; wasDue: boolean; bonusXp: number } {
  if (!previous) {
    return {
      next: { bestStars: stars, completions: 1, lastDate: localDate, box: 0, reviews: 0 },
      wasDue: false,
      bonusXp: 0,
    };
  }
  const wasDue = isReviewDue(previous, localDate);
  let box = previous.box;
  if (stars <= 1) box = Math.max(0, box - 1);
  else if (wasDue) box = Math.min(box + 1, REVIEW_INTERVALS.length - 1);
  const lastDate =
    previous.lastDate && previous.lastDate > localDate ? previous.lastDate : localDate;
  return {
    next: {
      bestStars: Math.max(previous.bestStars, stars),
      completions: previous.completions + 1,
      lastDate,
      box,
      reviews: previous.reviews + (wasDue ? 1 : 0),
    },
    wasDue,
    bonusXp: wasDue ? REVIEW_BONUS_XP : 0,
  };
}

export interface DueReview {
  lessonId: string;
  /** days since the lesson was last played */
  daysAgo: number;
}

/**
 * Lessons due for review today: the most overdue first, then in learning
 * order (older material first).
 */
export function reviewQueue(
  lessons: Record<string, LessonProgressDto>,
  today: string,
  max: number = MAX_REVIEWS_SHOWN,
): DueReview[] {
  return LESSONS.map((l, order) => ({ id: l.id, order, p: lessons[l.id] }))
    .filter((x) => isReviewDue(x.p, today))
    .map((x) => ({
      lessonId: x.id,
      order: x.order,
      daysAgo: daysBetween(x.p!.lastDate!, today),
      overdue: daysBetween(reviewDueDate(x.p!)!, today),
    }))
    .sort((a, b) => b.overdue - a.overdue || a.order - b.order)
    .slice(0, max)
    .map(({ lessonId, daysAgo }) => ({ lessonId, daysAgo }));
}
