import type { Lesson } from '@klavio/shared';
import type { LessonInputMode } from './useLessonInput';

export interface ExerciseProps<E> {
  exercise: E;
  lesson: Lesson;
  inputMode: LessonInputMode;
  /** Kids mode gives more help (hints right away). */
  kids: boolean;
  /** One more target note was played correctly. */
  onCorrect: () => void;
  /** a wrong note – with the note that was expected, where there is one */
  onMistake: (expected?: number) => void;
  onDone: () => void;
}

/** Time the feedback stays visible before the next task (ms). */
export const FEEDBACK_MS = 650;

/** Random order without the same note twice in a row. */
export function shuffleRounds(notes: number[], rounds: number, random = Math.random): number[] {
  const out: number[] = [];
  for (let i = 0; i < rounds; i++) {
    const choices = notes.length > 1 ? notes.filter((n) => n !== out[i - 1]) : notes;
    out.push(choices[Math.floor(random() * choices.length)]!);
  }
  return out;
}

/** All keys of the visible range that match `midi` (any octave or exactly). */
export function matchingKeys(midi: number, anyOctave: boolean, from: number, to: number): number[] {
  if (!anyOctave) return [midi];
  const out: number[] = [];
  for (let m = from; m <= to; m++) if (m % 12 === midi % 12) out.push(m);
  return out;
}
