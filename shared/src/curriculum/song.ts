import { noteNameToMidi } from '../music/notes.ts';
import type {
  PieceExercise,
  PieceNote,
  NoteValue,
  RhythmValue,
  SongExercise,
  SongNote,
} from './types.ts';

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

/** Position of a white key counted along the keyboard (black keys: the white key below). */
function whiteIndex(midi: number): number {
  const octave = Math.floor(midi / 12);
  const inOctave = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6][midi % 12]!;
  return octave * 7 + inOctave;
}

/** A hand in a five-finger position: which hand, and the key under the thumb. */
export interface HandPosition {
  hand: 'right' | 'left';
  thumb: string;
}

/**
 * The finger for a white key in a five-finger position (right: thumb on the
 * lowest key; left: thumb on the highest). Undefined outside the position.
 */
export function fingerInPosition(midi: number, position: HandPosition): number | undefined {
  const thumb = whiteIndex(noteNameToMidi(position.thumb));
  const f = position.hand === 'right' ? whiteIndex(midi) - thumb + 1 : thumb - whiteIndex(midi) + 1;
  return f >= 1 && f <= 5 ? f : undefined;
}

/**
 * Compact melody notation: notes as "pitch/value", bars separated by "|",
 * an optional finger after a colon ("E4/q:3").
 *   "C4/q D4/q E4/q F4/q | G4/h G4/h"
 * German "H" is accepted. Every bar must be full (checked against `time`).
 */
export function parseSong(melody: string, time: string, pickup = 0): SongNote[][] {
  const beatsPerBar = barBeats(time);
  const bars = melody
    .split('|')
    .map((bar) => bar.trim())
    .filter(Boolean)
    .map((bar, i) => {
      const notes = bar.split(/\s+/).map((token) => {
        const tie = token.endsWith('~');
        const [note, fingerText] = (tie ? token.slice(0, -1) : token).split(':');
        const [pitch, value = 'q'] = note!.split('/');
        if (!(value in VALUES) || value.endsWith('r')) {
          throw new Error(`Unknown note value "${value}" in bar ${i + 1}`);
        }
        const finger = fingerText === undefined ? undefined : Number(fingerText);
        if (finger !== undefined && !(finger >= 1 && finger <= 5)) {
          throw new Error(`Unknown finger "${fingerText}" in bar ${i + 1}`);
        }
        return {
          midi: noteNameToMidi(pitch!),
          value: value as NoteValue,
          ...(finger ? { finger } : {}),
          ...(tie ? { tie: true } : {}),
        };
      });
      return notes;
    });
  // an upbeat: the first bar is short, the last one makes up the rest
  bars.forEach((notes, i) => {
    const beats = notes.reduce((n, x) => n + VALUES[x.value], 0);
    const expected =
      pickup && i === 0
        ? pickup
        : pickup && i === bars.length - 1
          ? beatsPerBar - pickup
          : beatsPerBar;
    if (beats !== expected) {
      throw new Error(`Bar ${i + 1} has ${beats} beats, expected ${expected}`);
    }
  });
  // a tie joins two notes of the same pitch
  const flat = bars.flat();
  flat.forEach((n, i) => {
    if (n.tie && flat[i + 1]?.midi !== n.midi) {
      throw new Error(`A tie needs the same note after it (note ${i + 1})`);
    }
  });
  return bars;
}

/** Whether the i-th note of a song is only held (the tied continuation of the one before). */
export function isHeldNote(notes: SongNote[], i: number): boolean {
  return i > 0 && !!notes[i - 1]!.tie;
}

export function song(
  melody: string,
  opts: Partial<Omit<SongExercise, 'type' | 'bars'>> & {
    /** fingers for the notes from a five-finger position (explicit «:n» wins) */
    position?: HandPosition;
  } = {},
): SongExercise {
  const time = opts.time ?? '4/4';
  const position = opts.position;
  const pickup = opts.pickup ?? 0;
  const bars = parseSong(melody, time, pickup).map((bar) =>
    bar.map((n) => {
      const finger = n.finger ?? (position ? fingerInPosition(n.midi, position) : undefined);
      return finger ? { ...n, finger } : n;
    }),
  );
  return {
    type: 'song',
    clef: opts.clef ?? 'treble',
    time,
    tempo: opts.tempo ?? 96,
    showNames: opts.showNames ?? false,
    ...(pickup ? { pickup } : {}),
    bars,
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

/**
 * One hand of a piece: "C4/q D4/q r/h | …"; "r/<value>" is a rest. Every bar
 * must be full (checked against `time`).
 */
function parsePart(part: string, time: string, hand: string): PieceNote[][] {
  const beatsPerBar = barBeats(time);
  return part
    .split('|')
    .map((bar) => bar.trim())
    .filter(Boolean)
    .map((bar, i) => {
      const notes = bar.split(/\s+/).map((token): PieceNote => {
        const [pitch, value = 'q'] = token.split('/');
        if (pitch === 'r') {
          const rest = (value.endsWith('r') ? value : `${value}r`) as RhythmValue;
          if (!(rest in VALUES)) throw new Error(`Unknown rest "${token}" (${hand}, bar ${i + 1})`);
          return { midi: null, value: rest };
        }
        if (!(value in VALUES) || value.endsWith('r')) {
          throw new Error(`Unknown note value "${value}" (${hand}, bar ${i + 1})`);
        }
        return { midi: noteNameToMidi(pitch!), value: value as RhythmValue };
      });
      const beats = notes.reduce((n, x) => n + VALUES[x.value], 0);
      if (beats !== beatsPerBar) {
        throw new Error(`${hand} bar ${i + 1} has ${beats} beats, expected ${beatsPerBar}`);
      }
      return notes;
    });
}

/** A piece for both hands, written as two parts with the same number of bars. */
export function piece(
  rh: string,
  lh: string,
  opts: Partial<Omit<PieceExercise, 'type' | 'bars'>> = {},
): PieceExercise {
  const time = opts.time ?? '4/4';
  const right = parsePart(rh, time, 'right hand');
  const left = parsePart(lh, time, 'left hand');
  if (right.length !== left.length) {
    throw new Error(`Both hands need the same number of bars (${right.length} / ${left.length})`);
  }
  return {
    type: 'piece',
    time,
    tempo: opts.tempo ?? 90,
    showNames: opts.showNames ?? false,
    bars: right.map((r, i) => ({ rh: r, lh: left[i]! })),
  };
}

export interface PieceStep {
  /** start of the step in beats from the beginning */
  at: number;
  /** notes that start here (right hand first) */
  rh: number | null;
  lh: number | null;
  /** position in the bars, for highlighting */
  bar: number;
  rhIndex: number | null;
  lhIndex: number | null;
}

/** All moments where at least one note starts, in time order (both hands merged). */
export function pieceSteps(exercise: PieceExercise): PieceStep[] {
  const steps = new Map<number, PieceStep>();
  let barStart = 0;
  const beatsPerBar = barBeats(exercise.time);
  exercise.bars.forEach((bar, b) => {
    for (const hand of ['rh', 'lh'] as const) {
      let t = barStart;
      bar[hand].forEach((n, i) => {
        if (n.midi !== null) {
          const key = Math.round(t * 1000);
          const step = steps.get(key) ?? {
            at: t,
            rh: null,
            lh: null,
            bar: b,
            rhIndex: null,
            lhIndex: null,
          };
          step[hand] = n.midi;
          step[hand === 'rh' ? 'rhIndex' : 'lhIndex'] = i;
          steps.set(key, step);
        }
        t += VALUES[n.value];
      });
    }
    barStart += beatsPerBar;
  });
  return [...steps.values()].sort((a, b) => a.at - b.at);
}

/** Where a hand lies: the key under each finger (1 = thumb … 5). */
export interface HandShape {
  side: 'left' | 'right';
  /** finger → MIDI note; only fingers the lesson uses */
  keys: Partial<Record<1 | 2 | 3 | 4 | 5, number>>;
}

/**
 * The hand position of a lesson, read from the fingering of its first
 * exercise that has one (a five-finger tune or song) – only when every
 * finger always plays the same key. Else undefined (e.g. the thumb passes
 * under in a scale, or the hand moves).
 */
export function lessonHandShape(lesson: { exercises: readonly unknown[] }): HandShape | undefined {
  for (const raw of lesson.exercises) {
    const e = raw as {
      type: string;
      sequences?: number[][];
      fingers?: number[][];
      bars?: { midi: number; finger?: number }[][];
    };
    const pairs: [number, number][] = [];
    if (e.type === 'play-along' && e.sequences && e.fingers) {
      e.sequences.forEach((seq, i) =>
        seq.forEach((midi, j) => {
          const f = e.fingers![i]?.[j];
          if (f) pairs.push([f, midi]);
        }),
      );
    } else if (e.type === 'song' && e.bars) {
      for (const bar of e.bars) for (const n of bar) if (n.finger) pairs.push([n.finger, n.midi]);
    }
    if (pairs.length === 0) continue;
    const keys: HandShape['keys'] = {};
    for (const [f, midi] of pairs) {
      const finger = f as 1 | 2 | 3 | 4 | 5;
      if (keys[finger] !== undefined && keys[finger] !== midi) return undefined;
      keys[finger] = midi;
    }
    const used = Object.entries(keys).map(([f, m]) => [Number(f), m!] as const);
    if (used.length < 2) return undefined;
    used.sort((a, b) => a[0] - b[0]);
    const side = used.at(-1)![1] > used[0]![1] ? 'right' : 'left';
    // higher fingers must lie further out, in order
    for (let i = 1; i < used.length; i++) {
      const up = used[i]![1] > used[i - 1]![1];
      if (up !== (side === 'right')) return undefined;
    }
    return { side, keys };
  }
  return undefined;
}
