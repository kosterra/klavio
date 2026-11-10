import { describe, expect, it } from 'vitest';
import { isHeldNote, parseSong, song } from './song.ts';

describe('upbeat and ties', () => {
  it('accepts a short first bar when an upbeat is given; the last bar makes up the rest', () => {
    const e = song('G4/q | C5/q C5/q C5/q | C5/h', { time: '3/4', pickup: 1 });
    expect(e.pickup).toBe(1);
    expect(e.bars.map((b) => b.length)).toEqual([1, 3, 1]);
    // without the upbeat the short bars don't fit
    expect(() => song('G4/q | C5/q C5/q C5/q | C5/h', { time: '3/4' })).toThrow(/beats/);
    // a bar in the middle must be full
    expect(() => song('G4/q | C5/q | C5/h', { time: '3/4', pickup: 1 })).toThrow(/beats/);
  });

  it('a tie joins two equal notes: the second one is only held', () => {
    const notes = parseSong('C4/h D4/h~ | D4/h E4/h', '4/4').flat();
    expect(notes[1]).toMatchObject({ midi: 62, tie: true });
    expect(isHeldNote(notes, 2)).toBe(true);
    expect(isHeldNote(notes, 3)).toBe(false);
    expect(() => parseSong('C4/h D4/h~ | E4/w', '4/4')).toThrow(/tie/);
  });
});
