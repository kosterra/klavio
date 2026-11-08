/** Text in every supported UI language. */
export interface Localized {
  'de-CH': string;
  en: string;
}

/** "Finde die Taste": a note name is shown, the learner plays that key. */
export interface FindKeyExercise {
  type: 'find-key';
  /** Notes to ask for (MIDI). With `anyOctave`, only the pitch class counts. */
  notes: number[];
  rounds: number;
  anyOctave: boolean;
}

/** "Spiel nach": play the shown notes in order; the app waits for each one. */
export interface PlayAlongExercise {
  type: 'play-along';
  sequences: number[][];
  /** finger numbers per note (1 = thumb … 5 = little finger), same shape as `sequences` */
  fingers?: number[][];
}

/** "Notenlesen": a note is shown on the staff; play exactly that key. */
export interface ReadNoteExercise {
  type: 'read-note';
  /** 'grand': treble and bass staff together (notes from middle C up in the treble) */
  clef: 'treble' | 'bass' | 'grand';
  notes: number[];
  rounds: number;
}

/** Note values (VexFlow notation): whole, half, quarter, eighth; "d" = dotted. */
export type NoteValue = 'w' | 'h' | 'hd' | 'q' | 'qd' | '8';

export interface SongNote {
  midi: number;
  value: NoteValue;
  /** finger (1 = thumb … 5 = little finger), shown above the note */
  finger?: number;
}

/**
 * "Lied spielen": a melody on the staff, bar by bar. In "wait for me" mode the
 * song only moves on when the right note is played.
 */
export interface SongExercise {
  type: 'song';
  clef: 'treble' | 'bass';
  /** Time signature, e.g. "4/4". */
  time: string;
  /** Tempo for listening (quarter notes per minute). */
  tempo: number;
  /** Show note names below the notes (before note reading is learned). */
  showNames: boolean;
  bars: SongNote[][];
}

/** Rhythm values: note values plus rests ("qr" = quarter rest, …). */
export type RhythmValue = NoteValue | 'qr' | 'hr' | 'wr';

/**
 * "Rhythmus": play one bar in time with a metronome (after a count-in).
 * Any key counts — only the timing matters.
 */
export interface RhythmExercise {
  type: 'rhythm';
  time: string;
  /** Quarter notes per minute. */
  tempo: number;
  /** Pitch used to draw the notes (all on one line). */
  midi: number;
  /** One bar per pattern. */
  patterns: RhythmValue[][];
}

/** A note of one hand in a piece; `midi: null` is a rest. */
export interface PieceNote {
  midi: number | null;
  value: RhythmValue;
}

/**
 * "Stück für beide Hände": right hand in the treble, left hand in the bass
 * staff, bar by bar. In "wait for me" mode every step needs its notes; with
 * the microphone (one note at a time) the leading note of a step is enough.
 */
export interface PieceExercise {
  type: 'piece';
  time: string;
  tempo: number;
  showNames: boolean;
  bars: { rh: PieceNote[]; lh: PieceNote[] }[];
}

/**
 * "Improvisieren": play freely on the black keys over a little groove – there
 * are no wrong notes. Done after `bars` bars with at least `minNotes` notes.
 */
export interface ImproviseExercise {
  type: 'improvise';
  keys: 'black';
  tempo: number;
  bars: number;
  minNotes: number;
}

export type Exercise =
  | FindKeyExercise
  | PlayAlongExercise
  | ReadNoteExercise
  | SongExercise
  | RhythmExercise
  | PieceExercise
  | ImproviseExercise;

export interface Lesson {
  id: string;
  title: Localized;
  /** Short explanation shown before the lesson starts. */
  intro: Localized;
  /** XP for the first completion (replays give less, see rewards). */
  xp: number;
  /** Visible part of the on-screen keyboard (MIDI, white keys at both ends). */
  keyboard: { from: number; to: number };
  /** Note names on the keys (beginners) or not (when finding the key is the point). */
  keyLabels: 'all' | 'c' | 'none';
  /**
   * A bonus lesson (e.g. an extra song): open as soon as its chapter is, but
   * never in the way – the next lessons don't wait for it, and a chapter counts
   * as done without it. So new bonus lessons can join without holding anyone up.
   */
  bonus?: boolean;
  /** Song lessons are drawn differently on the learning path. */
  kind: 'keys' | 'play' | 'read' | 'song' | 'rhythm' | 'improvise';
  exercises: Exercise[];
}

export interface Chapter {
  id: string;
  title: Localized;
  /** level ("Stufe") the chapter belongs to; every level has its own map */
  stage: 1 | 2 | 3;
  lessons: Lesson[];
}

// ------------------------------------------------------------------ theory
// The "Entdecken" part before a lesson: short explanations with pictures and
// small games / quizzes. Nothing here is scored – wrong answers get a hint.

/** Pictures are drawn by the app from this description (no image files). */
export type TheoryPicture =
  | {
      kind: 'keyboard';
      from: number;
      to: number;
      labels?: 'all' | 'c' | 'none';
      /** keys to highlight */
      marks?: number[];
      /** finger numbers above keys: [midi, finger] */
      fingering?: [number, number][];
      /** brackets over the groups of two and three black keys */
      groups?: boolean;
      /** "lower ← → higher" under the keys */
      direction?: boolean;
    }
  | {
      kind: 'hand';
      /** which hand (seen from above); default right */
      side?: 'left' | 'right';
      /** finger to highlight (1 = thumb … 5 = little finger) */
      highlight?: number;
      /** show the numbers on the fingertips (false: "?" on the highlighted one) */
      numbers?: boolean;
    }
  | { kind: 'sticker'; sticker: string }
  | {
      kind: 'staff';
      clef: 'treble' | 'bass';
      notes: number[];
      /** note names below the notes */
      names?: boolean;
      /** colour the lines or the spaces of the staff */
      highlight?: 'lines' | 'spaces';
    }
  | {
      /** treble and bass staff together; notes from middle C up go into the treble */
      kind: 'grand-staff';
      notes: number[];
      names?: boolean;
    }
  | {
      kind: 'note-values';
      /** w = whole, h = half, q = quarter, qr = quarter rest */
      values: ('w' | 'h' | 'q' | 'qr')[];
      /** draw each value as a share of a pizza */
      pizza?: boolean;
    };

export interface ExplainStep {
  type: 'explain';
  text: Localized;
  picture?: TheoryPicture;
}

/** Tap keys on the screen keyboard – each target group counts once. */
export interface TapKeysStep {
  type: 'tap-keys';
  text: Localized;
  keyboard: { from: number; to: number };
  labels: 'all' | 'c' | 'none';
  /** groups of keys; tapping any key of a group finds the whole group */
  targets: number[][];
  /** find all groups, or any one of them */
  need: 'all' | 'one';
  /** shown after a wrong key */
  hint: Localized;
}

export interface QuizStep {
  type: 'quiz';
  text: Localized;
  picture?: TheoryPicture;
  /** exactly one is correct */
  answers: { text: Localized; correct?: true }[];
  hint?: Localized;
}

/** Listen to a few notes, then choose between two answers (e.g. higher / lower). */
export interface ListenStep {
  type: 'listen';
  text: Localized;
  answers: [Localized, Localized];
  rounds: { notes: number[]; answer: 0 | 1 }[];
}

/** Tap along on the screen with a metronome: one bar, any rhythm values (rests = don't tap). */
export interface ClapStep {
  type: 'clap';
  text: Localized;
  tempo: number;
  pattern: RhythmValue[];
}

export type TheoryStep = ExplainStep | TapKeysStep | QuizStep | ListenStep | ClapStep;
