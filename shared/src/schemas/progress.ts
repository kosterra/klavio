import { z } from 'zod';
import { ISO_DATE } from '../curriculum/rewards.ts';

export const isoDateSchema = z.string().regex(ISO_DATE);

/** Sent when a lesson is finished. Stars and XP are computed on the server. */
export const lessonCompleteSchema = z.object({
  mistakes: z.number().int().min(0).max(1000),
  durationSec: z.number().int().min(1).max(3600),
  /** The learner's local date (streaks follow their day). */
  localDate: isoDateSchema,
});
export type LessonCompleteInput = z.infer<typeof lessonCompleteSchema>;

export const progressQuerySchema = z.object({ date: isoDateSchema });

export interface LessonProgressDto {
  bestStars: number;
  completions: number;
  /** learner's local date of the last completion (YYYY-MM-DD) */
  lastDate: string | null;
  /** repetition step (index into REVIEW_INTERVALS) */
  box: number;
  /** reviews done while the lesson was due */
  reviews: number;
}

export interface ProgressDto {
  lessons: Record<string, LessonProgressDto>;
  today: { date: string; seconds: number; xp: number };
  /** the days of this week (from Monday) with practice, YYYY-MM-DD */
  weekDays: string[];
}

export interface LessonResultDto {
  stars: number;
  bestStars: number;
  firstCompletion: boolean;
  xpGained: number;
  xp: number;
  level: number;
  leveledUp: boolean;
  streak: { current: number; longest: number; lastActiveDate: string | null };
  today: { date: string; seconds: number; xp: number };
  /** the lesson was due for review (and gave the review bonus) */
  review: boolean;
  /** Badge ids earned with this lesson. */
  newBadges: string[];
}
