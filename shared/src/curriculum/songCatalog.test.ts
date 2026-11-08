import { describe, expect, it } from 'vitest';
import { SKILL_IDS } from './skills.ts';
import {
  SONG_CATALOG,
  editDistance,
  normalizeTitle,
  recognizeSong,
  searchSongs,
} from './songCatalog.ts';

describe('song catalog', () => {
  it('only uses known skills and has no duplicate titles', () => {
    const titles = new Set<string>();
    for (const song of SONG_CATALOG) {
      for (const s of song.skills) expect(SKILL_IDS).toContain(s);
      const key = normalizeTitle(song.title);
      expect(titles.has(key), song.title).toBe(false);
      titles.add(key);
    }
  });

  it('normalizes accents, umlauts and punctuation', () => {
    expect(normalizeTitle('  Für Elise! ')).toBe('fur elise');
    expect(normalizeTitle("Don't Stop Believin’")).toBe('dont stop believin');
  });
});

describe('recognizeSong', () => {
  it('recognises a song with its artist', () => {
    const guess = recognizeSong('Nothing Else Matters – Metallica')!;
    expect(guess.song?.artist).toBe('Metallica');
    expect(guess.style).toBe('ballad');
    expect(guess.skills).toEqual(
      expect.arrayContaining(['minor', 'six-eight', 'arpeggios', 'pedal']),
    );
  });

  it('knows German titles and ignores case and accents', () => {
    expect(recognizeSong('mondscheinsonate')?.song?.title).toBe('Moonlight Sonata');
    expect(recognizeSong('Fur Elise (Beethoven)')?.song?.title).toBe('Für Elise');
    expect(recognizeSong('Fluch der Karibik')?.song?.title).toBe("He's a Pirate");
  });

  it('prefers the longest match', () => {
    expect(recognizeSong('Prelude in E minor – Chopin')?.song?.title).toBe('Prelude in E minor');
  });

  it('matches whole words only', () => {
    expect(recognizeSong('Imagined Places')).toBeNull();
  });

  it('recognises titles with typos or missing letters', () => {
    for (const typed of [
      'Nothing Else Matter',
      'nothing els matters',
      'Nothnig Else Matters – Metalica',
      'Für Elize',
      'Mondscheinsonte',
      'Bohemian Rapsody',
    ]) {
      const guess = recognizeSong(typed);
      expect(guess?.song, typed).not.toBeNull();
      expect(guess?.fuzzy, typed).toBe(true);
    }
    expect(recognizeSong('Nothing Else Matter')?.song?.title).toBe('Nothing Else Matters');
    expect(recognizeSong('Bohemian Rapsody')?.song?.title).toBe('Bohemian Rhapsody');
  });

  it('does not guess a song from unrelated words', () => {
    expect(recognizeSong('Nothing to lose')).toBeNull();
    expect(recognizeSong('Let it rain')).toBeNull();
  });

  it('guesses from words in the title when the song is unknown', () => {
    const waltz = recognizeSong('Walzer in a-Moll von Grossmutter')!;
    expect(waltz.song).toBeNull();
    expect(waltz.skills).toEqual(expect.arrayContaining(['three-four', 'minor', 'left-hand']));
    expect(recognizeSong('Sonate in G – Haydn')?.style).toBe('classical');
    expect(recognizeSong('Ein Weihnachtslied')?.style).toBe('melody');
  });

  it('returns null for unknown titles', () => {
    expect(recognizeSong('xyz')).toBeNull();
    expect(recognizeSong('Mein Lied')).toBeNull();
  });
});

describe('editDistance', () => {
  it('counts typos, including swapped letters', () => {
    expect(editDistance('matters', 'matter')).toBe(1);
    expect(editDistance('nothnig', 'nothing')).toBe(1);
    expect(editDistance('elise', 'elise')).toBe(0);
  });
});

describe('searchSongs', () => {
  it('suggests songs while typing, best matches first', () => {
    expect(searchSongs('noth')[0]?.title).toBe('Nothing Else Matters');
    expect(searchSongs('metallica').map((s) => s.title)).toContain('Nothing Else Matters');
    expect(searchSongs('let it').map((s) => s.title)).toEqual(
      expect.arrayContaining(['Let It Be', 'Let It Go']),
    );
    expect(searchSongs('beethoven').length).toBeGreaterThanOrEqual(3);
  });

  it('tolerates typos and finds German titles', () => {
    expect(searchSongs('bohemain')[0]?.title).toBe('Bohemian Rhapsody');
    expect(searchSongs('mondschein')[0]?.title).toBe('Moonlight Sonata');
  });

  it('needs at least two letters and limits the list', () => {
    expect(searchSongs('n')).toEqual([]);
    expect(searchSongs('the').length).toBeLessThanOrEqual(8);
  });
});
