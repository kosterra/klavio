/**
 * Fingering for simple melodies: the hand rests on five neighbouring white
 * keys (a "position"); it moves only when a note does not fit. The plan has
 * as few moves as possible, and a move rather happens at a leap or after a
 * long note than in the middle of a run of steps. Black keys count as the
 * white key below (C♯ is played by the C finger's neighbour – good enough for
 * beginners' songs, which rarely have them).
 */

/** white-key index: C4 = 28, D4 = 29 … (black keys: the white key below) */
function whiteIndex(midi: number): number {
  const pc = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12);
  const inOctave = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6][pc]!;
  return octave * 7 + inOctave;
}

export interface FingeringNote {
  midi: number;
  /** length in beats (a move after a long note is easier) */
  beats?: number;
}

/**
 * Fingers 1–5 for every note. `hand`: the right hand has the thumb at the
 * bottom of the position, the left hand at the top.
 */
export function planFingering(notes: FingeringNote[], hand: 'rh' | 'lh' = 'rh'): number[] {
  if (!notes.length) return [];
  const idx = notes.map((n) => whiteIndex(n.midi));
  // possible positions per note: the lowest key of the five
  const options = idx.map((w) => [w - 4, w - 3, w - 2, w - 1, w]);
  // dynamic programming over (note, position): cost of moves
  const cost: Map<number, { c: number; from: number | null }>[] = [];
  options.forEach((opts, i) => {
    const row = new Map<number, { c: number; from: number | null }>();
    for (const p of opts) {
      // prefer a position with the note in the middle when nothing else decides
      const centre = Math.abs(idx[i]! - (p + 2)) * 0.01;
      if (i === 0) {
        row.set(p, { c: centre, from: null });
        continue;
      }
      let best = { c: Infinity, from: null as number | null };
      for (const [q, prev] of cost[i - 1]!) {
        let c = prev.c + centre;
        if (q !== p) {
          // a move: cheaper at a leap or after a long note, dearer within a run of steps
          const leap = Math.abs(idx[i]! - idx[i - 1]!);
          const long = (notes[i - 1]!.beats ?? 1) >= 2;
          c += 1 + (leap >= 2 ? -0.3 : 0.2) + (long ? -0.2 : 0) + Math.abs(q - p) * 0.05;
        }
        if (c < best.c) best = { c, from: q };
      }
      row.set(p, best);
    }
    cost.push(row);
  });
  // back from the cheapest end
  let [pos] = [...cost.at(-1)!.entries()].sort((a, b) => a[1].c - b[1].c)[0]!;
  const positions: number[] = [];
  for (let i = notes.length - 1; i >= 0; i--) {
    positions[i] = pos;
    const from = cost[i]!.get(pos)!.from;
    if (from !== null) pos = from;
  }
  return idx.map((w, i) => {
    const offset = w - positions[i]!; // 0 … 4 from the bottom of the position
    return hand === 'rh' ? offset + 1 : 5 - offset;
  });
}

/**
 * Where the hand moves: the first note and every note whose position differs
 * from the one before – the places worth a finger number.
 */
export function fingeringMarks(
  notes: FingeringNote[],
  hand: 'rh' | 'lh' = 'rh',
): (number | undefined)[] {
  const fingers = planFingering(notes, hand);
  const idx = notes.map((n) => whiteIndex(n.midi));
  const bottom = fingers.map((f, i) => (hand === 'rh' ? idx[i]! - (f - 1) : idx[i]! - (5 - f)));
  return fingers.map((f, i) => (i === 0 || bottom[i] !== bottom[i - 1] ? f : undefined));
}
