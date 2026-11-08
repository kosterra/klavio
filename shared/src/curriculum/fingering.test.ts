import { describe, expect, it } from 'vitest';
import { findLesson } from './curriculum.ts';
import { fingerInPosition, parseSong } from './song.ts';
import type { PlayAlongExercise, SongExercise } from './types.ts';
import { noteNameToMidi as n } from '../music/notes.ts';

describe('fingering', () => {
  it('counts fingers from the thumb in a five-finger position', () => {
    const rh = { hand: 'right', thumb: 'C4' } as const;
    expect(fingerInPosition(n('C4'), rh)).toBe(1);
    expect(fingerInPosition(n('G4'), rh)).toBe(5);
    expect(fingerInPosition(n('A4'), rh)).toBeUndefined();
    const lh = { hand: 'left', thumb: 'G3' } as const;
    expect(fingerInPosition(n('G3'), lh)).toBe(1);
    expect(fingerInPosition(n('C3'), lh)).toBe(5);
  });

  it('reads fingers written after a colon', () => {
    expect(parseSong('C4/h:1 E4/h:3', '4/4')[0]).toEqual([
      { midi: 60, value: 'h', finger: 1 },
      { midi: 64, value: 'h', finger: 3 },
    ]);
    expect(() => parseSong('C4/w:7', '4/4')).toThrow(/finger/);
  });

  it('gives every note of the fingered lessons a finger', () => {
    for (const id of ['keys-cde', 'keys-five', 'hand-scale', 'bass-hand']) {
      const e = findLesson(id)!.exercises[0] as PlayAlongExercise;
      expect(
        e.fingers?.map((f) => f.length),
        id,
      ).toEqual(e.sequences.map((s) => s.length));
    }
    for (const id of ['song-haenschen', 'song-freude', 'song-jingle', 'bass-lamb', 'black-lamb']) {
      const e = findLesson(id)!.exercises[0] as SongExercise;
      expect(
        e.bars.flat().every((note) => note.finger),
        id,
      ).toBe(true);
    }
    // the scale: thumb under after E
    expect((findLesson('hand-scale')!.exercises[0] as PlayAlongExercise).fingers![0]).toEqual([
      1, 2, 3, 1, 2, 3, 4, 5,
    ]);
  });
});
