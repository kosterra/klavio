import { describe, expect, it } from 'vitest';
import { piece, pieceSteps } from './song.ts';

describe('pieces for both hands', () => {
  it('parses both hands with rests and checks full bars', () => {
    const p = piece('C4/q D4/q E4/h', 'C3/h r/h');
    expect(p.bars[0]!.lh).toEqual([
      { midi: 48, value: 'h' },
      { midi: null, value: 'hr' },
    ]);
    expect(() => piece('C4/q', 'C3/w')).toThrow(/beats/);
    expect(() => piece('C4/w | C4/w', 'C3/w')).toThrow(/same number of bars/);
  });

  it('merges both hands into steps where notes start together', () => {
    const steps = pieceSteps(piece('C4/q D4/q E4/h | G4/w', 'C3/h G3/h | C3/w'));
    expect(steps.map((s) => [s.at, s.rh, s.lh])).toEqual([
      [0, 60, 48],
      [1, 62, null],
      [2, 64, 55],
      [4, 67, 48],
    ]);
    expect(steps[2]).toMatchObject({ bar: 0, rhIndex: 2, lhIndex: 1 });
  });
});
