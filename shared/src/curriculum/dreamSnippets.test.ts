import { describe, expect, it } from 'vitest';
import { DREAM_SNIPPETS, dreamSnippet } from './dreamSnippets.ts';
import { SONG_CATALOG } from './songCatalog.ts';
import { barBeats, beatsOf } from './song.ts';

describe('dream snippets', () => {
  it('belong to songs of the catalogue whose music is in the public domain', () => {
    for (const title of Object.keys(DREAM_SNIPPETS)) {
      const song = SONG_CATALOG.find((s) => s.title === title);
      expect(song, title).toBeDefined();
    }
    // songs under copyright stay titles only
    expect(dreamSnippet('Let It Be')).toBeUndefined();
    expect(dreamSnippet('Hallelujah')).toBeUndefined();
  });

  it('are a few full bars within the range of a small keyboard', () => {
    for (const [title, s] of Object.entries(DREAM_SNIPPETS)) {
      expect(s.bars.length, title).toBeGreaterThanOrEqual(4);
      expect(s.bars.length, title).toBeLessThanOrEqual(12);
      const notes = s.bars.flat();
      for (const n of notes) expect(n.midi, title).toBeGreaterThanOrEqual(48);
      for (const n of notes) expect(n.midi, title).toBeLessThanOrEqual(84);
      const beats = notes.reduce((b, n) => b + beatsOf(n.value), 0);
      // with an upbeat the first and the last bar together make one full bar
      expect(beats, title).toBe((s.bars.length - (s.pickup ? 1 : 0)) * barBeats(s.time));
    }
  });

  it('start like the originals', () => {
    expect(DREAM_SNIPPETS['Für Elise']!.bars[0]!.map((n) => n.midi)).toEqual([76, 75]);
    expect(DREAM_SNIPPETS['Ode to Joy']!.bars[0]!.map((n) => n.midi)).toEqual([64, 64, 65, 67]);
    expect(DREAM_SNIPPETS['Canon in D']!.keySignature).toBe('D');
  });
});
