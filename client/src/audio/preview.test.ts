import { describe, expect, it } from 'vitest';
import { piece, song } from '@klavio/shared';
import { previewBars } from './preview';

describe('«Hörprobe» length', () => {
  it('plays about 15 seconds of whole bars, whatever the tempo', () => {
    const bars = Array.from({ length: 40 }, () => 'C4/q D4/q E4/q F4/q').join(' | ');
    // 4/4 at 60: 4 s a bar → 4 bars; at 240: 1 s a bar → 15 bars
    expect(previewBars(song(bars, { tempo: 60 }))).toEqual({ from: 0, to: 4 });
    expect(previewBars(song(bars, { tempo: 240 }))).toEqual({ from: 0, to: 15 });
    // a short piece: all of it
    expect(previewBars(song('C4/w | D4/w', { tempo: 240 }))).toEqual({ from: 0, to: 2 });
  });

  it('starts at the first bar with a note', () => {
    const p = piece('r/w | C4/w | D4/w | E4/w', 'r/w | C3/w | C3/w | C3/w', { tempo: 120 });
    expect(previewBars(p).from).toBe(1);
  });
});
