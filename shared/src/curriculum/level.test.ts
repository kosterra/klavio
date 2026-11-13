import { describe, expect, it } from 'vitest';
import { LESSONS } from './curriculum.ts';
import { noteRate, pieceLevel } from './level.ts';
import { piece, song } from './song.ts';

describe('how hard a piece is', () => {
  it('the songs of the path are within its three stages', () => {
    for (const l of LESSONS)
      for (const e of l.exercises)
        if (e.type === 'song' || e.type === 'piece')
          expect(pieceLevel(e), l.id).toBeLessThanOrEqual(3);
  });

  it('a first melody is stage 1, two hands with black keys come later', () => {
    expect(pieceLevel(song('C4/q D4/q E4/h | D4/q C4/q C4/h'))).toBe(1);
    expect(pieceLevel(piece('C4/h F#4/q | G4/hd', 'C3/hd | G2/hd', { time: '3/4' }))).toBe(3);
  });

  it('beyond the path: fast sixteenths are «Anspruchsvoll», a calm one «Fortgeschritten»', () => {
    const bar = 'C4/16 D4/16 E4/16 F4/16 G4/16 F4/16 E4/16 D4/16 C4/16 D4/16 E4/16 F4/16 G4/q';
    const fast = song(Array.from({ length: 8 }, () => bar).join(' | '), { tempo: 200 });
    expect(noteRate(fast)).toBeGreaterThan(10);
    expect(pieceLevel(fast)).toBe(5);
    const calm = song(Array.from({ length: 8 }, () => bar).join(' | '), { tempo: 40 });
    expect(pieceLevel(calm)).toBe(4);
  });
});
