import type { Localized, PieceExercise, SongExercise } from './types.ts';
import { CLASSICS_DATA } from './classics.data.ts';

/**
 * Classical pieces to practise (not part of the learning path): like an own
 * piece – listening, one hand alone, printing – without stars. Each names
 * where its notes come from and under which licence.
 */
export interface ClassicPiece {
  id: string;
  title: Localized;
  composer: string;
  keyboard: { from: number; to: number };
  exercise: SongExercise | PieceExercise;
  source: { by: string; url: string; license: string; licenseUrl: string };
}

export const CLASSICS: ClassicPiece[] = CLASSICS_DATA;

export function findClassic(id: string): ClassicPiece | undefined {
  return CLASSICS.find((c) => c.id === id);
}
