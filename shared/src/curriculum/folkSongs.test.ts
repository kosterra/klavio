import { describe, expect, it } from 'vitest';
import { FOLK_SONGS, findClassic } from './classics.ts';
import { songExerciseSchema } from '../schemas/pieces.ts';

describe('Swiss folk songs', () => {
  it('are valid songs within their keyboard, with a source', () => {
    expect(FOLK_SONGS.length).toBeGreaterThan(0);
    for (const s of FOLK_SONGS) {
      expect(songExerciseSchema.safeParse(s.exercise).success).toBe(true);
      expect(s.id).toMatch(/^volk-/);
      expect(s.source.url).toMatch(/^https:\/\//);
      if (s.exercise.type !== 'song') throw new Error('a song');
      for (const n of s.exercise.bars.flat().filter((x) => !x.rest)) {
        expect(n.midi).toBeGreaterThanOrEqual(s.keyboard.from);
        expect(n.midi).toBeLessThanOrEqual(s.keyboard.to);
      }
      expect(findClassic(s.id)).toBe(s);
    }
  });

  it('Guggisberg: the melody of the print, sung from E', () => {
    const s = findClassic('volk-guggisberg')!;
    if (s.exercise.type !== 'song') throw new Error('a song');
    expect(s.exercise.bars).toHaveLength(17);
    expect(s.exercise.bars[0]!.map((n) => n.midi)).toEqual([64]);
    expect(s.exercise.bars.at(-1)!.map((n) => n.value)).toEqual(['hd']);
  });
});
