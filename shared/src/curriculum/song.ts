import { noteNameToMidi } from '../music/notes.ts';
import type { NoteValue, SongExercise, SongNote } from './types.ts';

const VALUES: Record<NoteValue, number> = { w: 4, hd: 3, h: 2, qd: 1.5, q: 1, '8': 0.5 };

/** Length of a note value in quarter notes. */
export function beatsOf(value: NoteValue): number {
  return VALUES[value];
}

/**
 * Compact melody notation: notes as "pitch/value", bars separated by "|".
 *   "C4/q D4/q E4/q F4/q | G4/h G4/h"
 * German "H" is accepted. Every bar must be full (checked against `time`).
 */
export function parseSong(melody: string, time: string): SongNote[][] {
  const [num, den] = time.split('/').map(Number) as [number, number];
  const barBeats = (num * 4) / den;
  return melody
    .split('|')
    .map((bar) => bar.trim())
    .filter(Boolean)
    .map((bar, i) => {
      const notes = bar.split(/\s+/).map((token) => {
        const [pitch, value = 'q'] = token.split('/');
        if (!(value in VALUES)) throw new Error(`Unknown note value "${value}" in bar ${i + 1}`);
        return { midi: noteNameToMidi(pitch!), value: value as NoteValue };
      });
      const beats = notes.reduce((n, x) => n + VALUES[x.value], 0);
      if (beats !== barBeats) {
        throw new Error(`Bar ${i + 1} has ${beats} beats, expected ${barBeats}: "${bar}"`);
      }
      return notes;
    });
}

export function song(
  melody: string,
  opts: Partial<Omit<SongExercise, 'type' | 'bars'>> = {},
): SongExercise {
  const time = opts.time ?? '4/4';
  return {
    type: 'song',
    clef: opts.clef ?? 'treble',
    time,
    tempo: opts.tempo ?? 96,
    showNames: opts.showNames ?? false,
    bars: parseSong(melody, time),
  };
}

export function songNotes(exercise: SongExercise): SongNote[] {
  return exercise.bars.flat();
}
