import { beatsOf } from './song.ts';
import type { PieceExercise, SongExercise, TimedSongExercise } from './types.ts';
import { fingeringMarks } from '../music/fingering.ts';

/**
 * The finger numbers to show over a song's notes (flat, in order): the ones
 * written into the song – or, where the song has none and the hand has to
 * move, the planned fingering at every place where it moves. A tune within
 * five keys shows none (the hand picture at the start says where it rests).
 */
export function songFingers(e: SongExercise | TimedSongExercise): (number | undefined)[] {
  const notes = e.bars.flat();
  if (notes.some((n) => n.finger)) return notes.map((n) => n.finger);
  // rests are left out of the plan and get no number
  const sounding = notes.filter((n) => !n.rest);
  const marks = fingeringMarks(
    sounding.map((n) => ({ midi: n.midi, beats: beatsOf(n.value) })),
    e.clef === 'bass' ? 'lh' : 'rh',
  );
  const moves = marks.filter((m) => m !== undefined).length;
  if (moves <= 1) return notes.map(() => undefined);
  let k = 0;
  return notes.map((n) => (n.rest ? undefined : marks[k++]));
}

/**
 * The same for a piece, hand by hand: per bar, the finger to show at each note
 * (undefined for rests and where the hand stays). Written fingers win; a hand
 * that never leaves its five keys shows none.
 */
export function pieceFingers(
  e: PieceExercise,
): { rh: (number | undefined)[]; lh: (number | undefined)[] }[] {
  const per = (hand: 'rh' | 'lh') => {
    const notes = e.bars.flatMap((b) => b[hand]);
    const played = notes.filter((n) => n.midi !== null);
    let planned: (number | undefined)[];
    if (played.some((n) => n.finger)) planned = played.map((n) => n.finger);
    else {
      const marks = fingeringMarks(
        played.map((n) => ({ midi: n.midi!, beats: beatsOf(n.value) })),
        hand,
      );
      planned =
        marks.filter((m) => m !== undefined).length > 1 ? marks : played.map(() => undefined);
    }
    let k = 0;
    const flat = notes.map((n) => (n.midi === null ? undefined : planned[k++]));
    let i = 0;
    return e.bars.map((b) => b[hand].map(() => flat[i++]));
  };
  const rh = per('rh');
  const lh = per('lh');
  return e.bars.map((_, b) => ({ rh: rh[b]!, lh: lh[b]! }));
}
