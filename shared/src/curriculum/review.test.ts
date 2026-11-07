import { describe, expect, it } from 'vitest';
import { LESSONS } from './curriculum.ts';
import {
  REVIEW_BONUS_XP,
  applyCompletion,
  daysBetween,
  isReviewDue,
  reviewDueDate,
  reviewQueue,
} from './review.ts';
import type { LessonProgressDto } from '../schemas/progress.ts';

const p = (
  lastDate: string,
  box: number,
  extra: Partial<LessonProgressDto> = {},
): LessonProgressDto => ({
  bestStars: 3,
  completions: 1,
  lastDate,
  box,
  reviews: 0,
  ...extra,
});

describe('review schedule', () => {
  it('is due after 1, 3, 7, 14 and then 30 days', () => {
    expect(reviewDueDate(p('2026-11-01', 0))).toBe('2026-11-02');
    expect(reviewDueDate(p('2026-11-01', 1))).toBe('2026-11-04');
    expect(reviewDueDate(p('2026-11-01', 2))).toBe('2026-11-08');
    expect(reviewDueDate(p('2026-11-01', 3))).toBe('2026-11-15');
    expect(reviewDueDate(p('2026-11-01', 4))).toBe('2026-12-01');
    expect(reviewDueDate(p('2026-11-01', 9))).toBe('2026-12-01');
    expect(isReviewDue(p('2026-11-01', 1), '2026-11-03')).toBe(false);
    expect(isReviewDue(p('2026-11-01', 1), '2026-11-04')).toBe(true);
    expect(isReviewDue(undefined, '2026-11-04')).toBe(false);
    expect(isReviewDue(p('2026-11-01', 0, { lastDate: null }), '2026-11-04')).toBe(false);
  });

  it('a first completion starts at step 0', () => {
    const r = applyCompletion(undefined, 2, '2026-11-07');
    expect(r.next).toEqual({
      bestStars: 2,
      completions: 1,
      lastDate: '2026-11-07',
      box: 0,
      reviews: 0,
    });
    expect(r.wasDue).toBe(false);
    expect(r.bonusXp).toBe(0);
  });

  it('a good review when due moves on and gives a bonus', () => {
    const r = applyCompletion(p('2026-11-01', 1), 2, '2026-11-05');
    expect(r.wasDue).toBe(true);
    expect(r.bonusXp).toBe(REVIEW_BONUS_XP);
    expect(r.next).toMatchObject({ box: 2, reviews: 1, lastDate: '2026-11-05', completions: 2 });
  });

  it('playing again early keeps the step; a weak result goes one step back', () => {
    expect(applyCompletion(p('2026-11-01', 2), 3, '2026-11-02').next.box).toBe(2);
    expect(applyCompletion(p('2026-11-01', 2), 3, '2026-11-02').bonusXp).toBe(0);
    expect(applyCompletion(p('2026-11-01', 2), 1, '2026-11-02').next.box).toBe(1);
    expect(applyCompletion(p('2026-11-01', 0), 1, '2026-11-05').next.box).toBe(0);
    expect(applyCompletion(p('2026-11-01', 4), 3, '2026-12-05').next.box).toBe(4);
  });

  it('late offline results never move the date backwards', () => {
    expect(applyCompletion(p('2026-11-07', 1), 3, '2026-11-03').next.lastDate).toBe('2026-11-07');
  });

  it('the queue shows the most overdue first, then older lessons, at most three', () => {
    const [a, b, c, d] = LESSONS.map((l) => l.id);
    const lessons = {
      [a!]: p('2026-11-05', 0), // due since 11-06 → 1 day overdue
      [b!]: p('2026-10-20', 2), // due since 10-27 → 11 days overdue
      [c!]: p('2026-11-06', 0), // due today
      [d!]: p('2026-11-07', 0), // not due
    };
    expect(reviewQueue(lessons, '2026-11-07')).toEqual([
      { lessonId: b, daysAgo: 18 },
      { lessonId: a, daysAgo: 2 },
      { lessonId: c, daysAgo: 1 },
    ]);
    expect(reviewQueue(lessons, '2026-11-07', 1)).toHaveLength(1);
    expect(daysBetween('2026-10-31', '2026-11-02')).toBe(2);
  });
});
