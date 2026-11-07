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
}

/** "Notenlesen": a note is shown on the staff; play exactly that key. */
export interface ReadNoteExercise {
  type: 'read-note';
  clef: 'treble' | 'bass';
  notes: number[];
  rounds: number;
}

export type Exercise = FindKeyExercise | PlayAlongExercise | ReadNoteExercise;

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
  /** Song lessons are drawn differently on the learning path. */
  kind: 'keys' | 'play' | 'read' | 'song';
  exercises: Exercise[];
}

export interface Chapter {
  id: string;
  title: Localized;
  lessons: Lesson[];
}
