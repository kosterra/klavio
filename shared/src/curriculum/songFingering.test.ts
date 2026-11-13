import { describe, expect, it } from 'vitest';
import { piece } from './song.ts';
import { pieceFingers } from './songFingering.ts';
import { findLesson } from './curriculum.ts';
import type { PieceExercise } from './types.ts';

describe('piece fingering', () => {
  it('reads written fingers in a part and refuses impossible ones', () => {
    const p = piece('C4/h:1 G4/h:5', 'C3/w');
    expect(p.bars[0]!.rh.map((n) => n.finger)).toEqual([1, 5]);
    expect(() => piece('C4/w:6', 'C3/w')).toThrow(/Unknown finger/);
  });

  it('written fingers win, rests get none', () => {
    const p = piece('C4/q:1 r/q E4/q:3 r/q', 'C3/w');
    expect(pieceFingers(p)[0]!.rh).toEqual([1, undefined, 3, undefined]);
  });

  it('a hand that stays in its five keys shows no numbers', () => {
    const e = findLesson('both-together')!.exercises[0] as PieceExercise;
    const fingers = pieceFingers(e);
    expect(fingers.every((b) => [...b.rh, ...b.lh].every((f) => f === undefined))).toBe(true);
  });

  it('where a hand moves, the planned fingers appear – hand by hand', () => {
    // the right hand climbs an octave: it has to move at least once
    const p = piece('C4/q D4/q E4/q F4/q | G4/q A4/q H4/q C5/q | C5/w', 'C3/w | C3/w | C3/w');
    const rh = pieceFingers(p).flatMap((b) => b.rh);
    expect(rh[0]).toBe(1);
    expect(rh.filter((f) => f !== undefined).length).toBeGreaterThan(1);
    // the left hand never moves: nothing to show
    expect(
      pieceFingers(p)
        .flatMap((b) => b.lh)
        .every((f) => f === undefined),
    ).toBe(true);
  });
});
