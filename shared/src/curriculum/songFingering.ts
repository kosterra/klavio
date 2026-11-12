import { beatsOf } from './song.ts';
import type { SongExercise, TimedSongExercise } from './types.ts';
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
  const marks = fingeringMarks(
    notes.map((n) => ({ midi: n.midi, beats: beatsOf(n.value) })),
    e.clef === 'bass' ? 'lh' : 'rh',
  );
  const moves = marks.filter((m) => m !== undefined).length;
  return moves > 1 ? marks : notes.map(() => undefined);
}
