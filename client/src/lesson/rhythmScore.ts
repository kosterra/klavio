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
