import { noteNameToMidi } from '../music/notes.ts';
import type { NoteValue, RhythmValue, SongExercise, SongNote } from './types.ts';

const VALUES: Record<RhythmValue, number> = {
  w: 4,
  hd: 3,
  h: 2,
  qd: 1.5,
  q: 1,
  '8': 0.5,
  wr: 4,
  hr: 2,
  qr: 1,
};

/** Length of a note value or rest in quarter notes. */
export function beatsOf(value: RhythmValue): number {
  return VALUES[value];
}

export function isRest(value: RhythmValue): boolean {
  return value.endsWith('r');
}

/** Beats per bar for a time signature ("3/4" → 3, "6/8" → 3). */
export function barBeats(time: string): number {
  const [num, den] = time.split('/').map(Number) as [number, number];
  return (num * 4) / den;
}

/** Start of each played (non-rest) note of a rhythm bar, in quarter-note beats. */
export function rhythmOnsets(pattern: RhythmValue[]): number[] {
  const out: number[] = [];
  let t = 0;
  for (const v of pattern) {
    if (!isRest(v)) out.push(t);
    t += VALUES[v];
  }
  return out;
}

/**
 * Compact melody notation: notes as "pitch/value", bars separated by "|".
 *   "C4/q D4/q E4/q F4/q | G4/h G4/h"
 * German "H" is accepted. Every bar must be full (checked against `time`).
 */
export function parseSong(melody: string, time: string): SongNote[][] {
  const beatsPerBar = barBeats(time);
  return melody
    .split('|')
    .map((bar) => bar.trim())
    .filter(Boolean)
    .map((bar, i) => {
      const notes = bar.split(/\s+/).map((token) => {
        const [pitch, value = 'q'] = token.split('/');
        if (!(value in VALUES) || value.endsWith('r')) {
          throw new Error(`Unknown note value "${value}" in bar ${i + 1}`);
        }
        return { midi: noteNameToMidi(pitch!), value: value as NoteValue };
      });
      const beats = notes.reduce((n, x) => n + VALUES[x.value], 0);
      if (beats !== beatsPerBar) {
        throw new Error(`Bar ${i + 1} has ${beats} beats, expected ${beatsPerBar}: "${bar}"`);
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

/** "q q h | qr q h" → rhythm bars, each checked to be full. */
export function rhythm(
  patterns: string,
  opts: { time?: string; tempo?: number; midi?: number } = {},
) {
  const time = opts.time ?? '4/4';
  const bars = patterns.split('|').map((b) => b.trim().split(/\s+/) as RhythmValue[]);
  bars.forEach((bar, i) => {
    for (const v of bar) if (!(v in VALUES)) throw new Error(`Unknown rhythm value "${v}"`);
    const beats = bar.reduce((n, v) => n + VALUES[v], 0);
    if (beats !== barBeats(time)) throw new Error(`Rhythm bar ${i + 1} has ${beats} beats`);
  });
  return {
    type: 'rhythm' as const,
    time,
    tempo: opts.tempo ?? 80,
    midi: opts.midi ?? noteNameToMidi('C5'),
    patterns: bars,
  };
}
