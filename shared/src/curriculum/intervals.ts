import { isBlackKey } from '../music/notes.ts';

/**
 * Intervals as they are read: the distance between two notes in steps on the
 * staff (white keys). 1 = a second (a step: line to space), 2 = a third (a
 * skip: line to line), 3 = a fourth, 4 = a fifth.
 */

/** The white key `steps` staff steps above (or, negative, below) a white key. */
export function whiteStep(midi: number, steps: number): number {
  if (isBlackKey(midi)) throw new Error(`${midi} is not a white key`);
  let m = midi;
  const dir = Math.sign(steps);
  for (let i = 0; i < Math.abs(steps); i++) {
    m += dir;
    while (isBlackKey(m)) m += dir;
  }
  return m;
}

/**
 * Every pair [first, second] of keys from `notes` that lie one of `steps`
 * apart – up and down. The pairs an «Intervallregen» draws from.
 */
export function intervalPairs(
  notes: readonly number[],
  steps: readonly number[],
): [number, number][] {
  const keys = new Set(notes);
  const out: [number, number][] = [];
  for (const from of notes) {
    for (const s of steps) {
      for (const to of [whiteStep(from, s), whiteStep(from, -s)]) {
        if (keys.has(to)) out.push([from, to]);
      }
    }
  }
  return out;
}

/** The staff steps between two white keys (always positive). */
export function staffSteps(a: number, b: number): number {
  const [lo, hi] = a < b ? [a, b] : [b, a];
  let n = 0;
  for (let m = lo; m < hi; m++) if (!isBlackKey(m + 1)) n++;
  return n;
}
