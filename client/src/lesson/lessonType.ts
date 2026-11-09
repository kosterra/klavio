import type { Lesson } from '@klavio/shared';

/** What a lesson is about, for its icon on the learning path and its label. */
export const LESSON_TYPES = [
  'keys',
  'play',
  'read',
  'song',
  'rhythm',
  'ear',
  'chords',
  'expression',
  'improvise',
] as const;
export type LessonType = (typeof LESSON_TYPES)[number];

export function lessonType(lesson: Lesson): LessonType {
  const types = new Set(lesson.exercises.map((e) => e.type));
  if (types.has('echo')) return 'ear';
  if (types.has('chords')) return 'chords';
  if (types.has('dynamics') || types.has('pedal')) return 'expression';
  return lesson.kind;
}
