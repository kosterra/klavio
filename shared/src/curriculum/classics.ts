import type { Localized, PieceExercise, SongExercise } from './types.ts';
import { CLASSICS_DATA } from './classics.data.ts';
import { FOLK_SONGS } from './folkSongs.ts';

/**
 * Classical pieces to practise (not part of the learning path): like an own
 * piece – listening, one hand alone, printing – without stars. Each names
 * where its notes come from and under which licence.
 */
export interface ClassicPiece {
  id: string;
  title: Localized;
  /** the composer – or, for a folk song, where it comes from */
  composer: string | Localized;
  keyboard: { from: number; to: number };
  exercise: SongExercise | PieceExercise;
  source: { by: string; url: string; license: string; licenseUrl: string };
}

export const CLASSICS: ClassicPiece[] = CLASSICS_DATA;

export { FOLK_SONGS };

/** A classical piece or a folk song by its id. */
export function findClassic(id: string): ClassicPiece | undefined {
  return CLASSICS.find((c) => c.id === id) ?? FOLK_SONGS.find((c) => c.id === id);
}
