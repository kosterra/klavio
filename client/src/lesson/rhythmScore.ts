export type BeatVerdict = 'ok' | 'early' | 'late' | 'missed';

export interface RhythmScore {
  /** One verdict per expected note. */
  perNote: BeatVerdict[];
  /** Played notes that matched nothing (extra taps). */
  extra: number;
  missed: number;
  /** Signed deviation (ms) of each matched note; positive = late. */
  deltas: (number | null)[];
}

/**
 * Matches played onsets to expected ones (nearest first, each used once).
 * Within `toleranceMs` a note counts; within half of it, it's "on time",
 * otherwise "early" / "late" (still counted, but shown as a hint).
 */
export function scoreRhythm(
  expectedMs: number[],
  playedMs: number[],
  toleranceMs: number,
): RhythmScore {
  // All (expected, played) pairs within the tolerance, closest first: every
  // tap goes to the beat it is nearest to, each used at most once.
  const pairs: { e: number; p: number; d: number }[] = [];
  expectedMs.forEach((t, e) =>
    playedMs.forEach((x, p) => {
      if (Math.abs(x - t) <= toleranceMs) pairs.push({ e, p, d: x - t });
    }),
  );
  pairs.sort((a, b) => Math.abs(a.d) - Math.abs(b.d));
  const deltas: (number | null)[] = expectedMs.map(() => null);
  const used = new Set<number>();
  for (const { e, p, d } of pairs) {
    if (deltas[e] !== null || used.has(p)) continue;
    deltas[e] = d;
    used.add(p);
  }
  const perNote: BeatVerdict[] = deltas.map((d) =>
    d === null ? 'missed' : Math.abs(d) <= toleranceMs / 2 ? 'ok' : d < 0 ? 'early' : 'late',
  );
  return {
    perNote,
    deltas,
    extra: playedMs.length - used.size,
    missed: perNote.filter((v) => v === 'missed').length,
  };
}

/** Typical delay until each input reports a note (ms) — subtracted before scoring. */
export const INPUT_DELAY_MS = { microphone: 40, midi: 0, keyboard: 0 } as const;

export interface TimedNote {
  ms: number;
  midi: number;
}

export interface MelodyScore extends RhythmScore {
  /** played notes with a pitch the song doesn't have at that moment */
  wrong: number;
}

/**
 * «Im Takt»: like scoreRhythm, but a played note only counts for an expected
 * one with the same pitch. Played notes that match nothing are wrong notes
 * (wrong key) or extra (right key, wrong moment).
 */
export function scoreMelody(
  expected: TimedNote[],
  played: TimedNote[],
  toleranceMs: number,
): MelodyScore {
  const pairs: { e: number; p: number; d: number }[] = [];
  expected.forEach((x, e) =>
    played.forEach((y, p) => {
      if (y.midi === x.midi && Math.abs(y.ms - x.ms) <= toleranceMs) {
        pairs.push({ e, p, d: y.ms - x.ms });
      }
    }),
  );
  pairs.sort((a, b) => Math.abs(a.d) - Math.abs(b.d));
  const deltas: (number | null)[] = expected.map(() => null);
  const used = new Set<number>();
  for (const { e, p, d } of pairs) {
    if (deltas[e] !== null || used.has(p)) continue;
    deltas[e] = d;
    used.add(p);
  }
  const perNote: BeatVerdict[] = deltas.map((d) =>
    d === null ? 'missed' : Math.abs(d) <= toleranceMs / 2 ? 'ok' : d < 0 ? 'early' : 'late',
  );
  const pitches = new Set(expected.map((x) => x.midi));
  const unmatched = played.filter((_, p) => !used.has(p));
  const wrong = unmatched.filter((y) => !pitches.has(y.midi)).length;
  return {
    perNote,
    deltas,
    wrong,
    extra: unmatched.length - wrong,
    missed: perNote.filter((v) => v === 'missed').length,
  };
}

/**
 * The delay of this input on this device, from the playing itself: the
 * microphone hears a note some 100–250 ms after the key was struck (different
 * on every phone). Each played note is compared with the nearest expected note
 * of the same pitch; the median of those offsets (0 … `maxMs`) is the part that
 * is the same for every note – the device, not the rhythm.
 */
export function inputLatency(expected: TimedNote[], played: TimedNote[], maxMs = 400): number {
  const offsets: number[] = [];
  for (const y of played) {
    let best: number | null = null;
    for (const x of expected) {
      if (x.midi !== y.midi) continue;
      const d = y.ms - x.ms;
      if (d < -150 || d > maxMs + 150) continue;
      if (best === null || Math.abs(d) < Math.abs(best)) best = d;
    }
    if (best !== null) offsets.push(best);
  }
  // too few notes to tell the device from the learner
  if (offsets.length < 3) return 0;
  offsets.sort((a, b) => a - b);
  const median = offsets[Math.floor(offsets.length / 2)]!;
  return Math.min(maxMs, Math.max(0, median));
}
