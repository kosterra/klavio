/**
 * Stars, XP, levels and streaks. Shared so that the server computes the
 * authoritative values and the client can show the same rules.
 * No dark patterns: XP never decreases, a missed day only resets the streak.
 */

export type Stars = 1 | 2 | 3;

/** 3 stars at ≥ 90 % accuracy, 2 at ≥ 75 %, finishing always gives 1. */
export function starsFor(targets: number, mistakes: number): Stars {
  const accuracy = targets / (targets + Math.max(0, mistakes));
  return accuracy >= 0.9 ? 3 : accuracy >= 0.75 ? 2 : 1;
}

/**
 * First completion: full lesson XP + 5 per star. Replays: half the lesson XP
 * (practice still counts) + 5 per star improved.
 */
export function xpFor(lessonXp: number, stars: Stars, previousBestStars: number): number {
  if (previousBestStars === 0) return lessonXp + 5 * stars;
  return Math.round(lessonXp / 2) + 5 * Math.max(0, stars - previousBestStars);
}

/** Total XP needed to reach a level: 0, 50, 150, 300, 500, … */
export function xpForLevel(level: number): number {
  return 25 * level * (level - 1);
}

export function levelForXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** "2026-11-07" + 1 → "2026-11-08" (calendar arithmetic, no time zones). */
export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Learner's local calendar date (the streak follows their day, not the server's). */
export function localIsoDate(date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

export interface Streak {
  current: number;
  longest: number;
  lastActiveDate: string | null;
}

/**
 * Practising today keeps the streak; yesterday → +1; a gap starts again at 1.
 * A day before the last active one (a result synced late) changes nothing.
 */
export function nextStreak(streak: Streak, today: string): Streak {
  if (streak.lastActiveDate && today <= streak.lastActiveDate) return streak;
  const current = streak.lastActiveDate === addDays(today, -1) ? streak.current + 1 : 1;
  return { current, longest: Math.max(streak.longest, current), lastActiveDate: today };
}
