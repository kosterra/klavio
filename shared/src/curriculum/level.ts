import { CURRICULUM } from './curriculum.ts';
import { pieceReadiness, type BeyondNeed, type Readiness } from './readiness.ts';
import type { PieceExercise, SongExercise } from './types.ts';

/**
 * How hard a piece is, roughly: 1–3 are the stages of the path (the piece fits
 * the one in which its last need is taught), 4 «Fortgeschritten» and 5
 * «Anspruchsvoll» go beyond it – told apart by how many notes come per second
 * and how many things the path doesn't teach (sixteenths, triplets …).
 */
export type PieceLevel = 1 | 2 | 3 | 4 | 5;

const RHYTHM: BeyondNeed[] = ['sixteenths', 'dotted-eighths', 'triplets', 'other-time'];
const RANGE: BeyondNeed[] = ['very-high', 'very-low', 'key-d'];

/** Notes per second in the busy bars (the 90th percentile), both hands together. */
export function noteRate(exercise: SongExercise | PieceExercise): number {
  const [n, d] = exercise.time.split('/').map(Number) as [number, number];
  const barSeconds = (((n * 4) / d) * 60) / Math.max(20, exercise.tempo);
  const rates = exercise.bars
    .map((bar) =>
      Array.isArray(bar)
        ? bar.filter((x) => !x.rest && x.midi >= 0).length
        : [...bar.rh, ...bar.lh].filter((x) => x.midi !== null).length,
    )
    .map((count) => count / barSeconds)
    .sort((a, b) => a - b);
  return rates[Math.floor(rates.length * 0.9)] ?? 0;
}

export function pieceLevel(
  exercise: SongExercise | PieceExercise,
  readiness: Readiness = pieceReadiness(exercise),
): PieceLevel {
  const stage =
    CURRICULUM.find((c) => c.lessons.some((l) => l.id === readiness.lesson.id))?.stage ?? 3;
  const rate = noteRate(exercise);
  const rhythm = readiness.beyond.filter((b) => RHYTHM.includes(b)).length;
  const range = readiness.beyond.filter((b) => RANGE.includes(b)).length;
  // within the path: what it teaches, at a pace a learner of it can follow
  if (rhythm === 0 && rate <= 4.5) return stage;
  return rate + 1.5 * rhythm + 0.5 * range < 12 ? 4 : 5;
}
