import {
  pieceLevel,
  pieceReadiness,
  type PieceExercise,
  type PieceLevel,
  type SongExercise,
} from '@klavio/shared';

/** A piece's level, and whether this profile has done the lessons it needs. */
export function levelFor(
  exercise: SongExercise | PieceExercise,
  done: ReadonlySet<string> | null,
): { level: PieceLevel; ready: boolean } {
  const readiness = pieceReadiness(exercise);
  const level = pieceLevel(exercise, readiness);
  return { level, ready: level <= 3 && !!done?.has(readiness.lesson.id) };
}
