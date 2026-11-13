import { parseSong } from './song.ts';
import type { SightReadExercise, SongNote } from './types.ts';

/** A rhythm without pitches ("q q q q | h h") as bars of notes (all on one placeholder key). */
export function sightRhythm(rhythm: string, time: string): SongNote[][] {
  const melody = rhythm
    .trim()
    .split(/\s+/)
    .map((token) => (token === '|' ? '|' : `C4/${token}`))
    .join(' ');
  return parseSong(melody, time);
}

/** How many notes each melody of the exercise has (every rhythm has the same). */
export function sightNoteCount(e: Pick<SightReadExercise, 'rhythms' | 'time'>): number {
  return sightRhythm(e.rhythms[0]!, e.time).flat().length;
}

/**
 * A new melody to read at sight: one of the rhythms, with keys that move by
 * step, skip or repeat – the way first pieces do – and come home to the
 * tonic at the end. `random` returns numbers in [0, 1).
 */
export function sightMelody(
  e: Pick<SightReadExercise, 'notes' | 'rhythms' | 'time' | 'tonic'>,
  random: () => number = Math.random,
): SongNote[][] {
  const bars = sightRhythm(e.rhythms[Math.floor(random() * e.rhythms.length)]!, e.time);
  const keys = e.notes;
  const home = Math.max(0, keys.indexOf(e.tonic ?? keys[0]!));
  const count = bars.flat().length;
  // steps are more common than skips; a repeated note now and then
  const moves = [-1, 1, -1, 1, -2, 2, 0];
  // start on the tonic or a note near it
  let at = Math.min(keys.length - 1, home + [0, 0, 2, 4][Math.floor(random() * 4)]!);
  const path: number[] = [at];
  for (let i = 1; i < count; i++) {
    const left = count - 1 - i;
    if (left === 0) {
      at = home;
    } else {
      const options = moves
        .map((m) => at + m)
        // on the keyboard, and still able to come home in the notes that are left
        .filter((k) => k >= 0 && k < keys.length && Math.abs(k - home) <= 2 * left)
        // not the same key three times in a row
        .filter((k) => !(k === path.at(-1) && k === path.at(-2)));
      at = options[Math.floor(random() * options.length)] ?? home;
    }
    path.push(at);
  }
  let k = 0;
  return bars.map((bar) => bar.map((n) => ({ midi: keys[path[k++]!]!, value: n.value })));
}
