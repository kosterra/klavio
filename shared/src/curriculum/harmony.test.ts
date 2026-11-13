import { describe, expect, it } from 'vitest';
import { CURRICULUM } from './curriculum.ts';
import { accompaniment, harmonize, melodyKey } from './harmony.ts';
import { beatsOf, song } from './song.ts';
import type { SongExercise } from './types.ts';

const songs = CURRICULUM.flatMap((c) =>
  c.lessons.flatMap((l) =>
    l.exercises.filter((e): e is SongExercise => e.type === 'song').map((e) => ({ id: l.id, e })),
  ),
);

describe('Klavi plays along', () => {
  it('finds the key of a melody', () => {
    expect(melodyKey(song('C4/q D4/q E4/q C4/q | C4/w').bars)).toBe(0);
    expect(melodyKey(song('G4/q A4/q H4/q C5/q | D5/q F#5/q G5/h').bars)).toBe(7);
  });

  it('ends every song on its home chord and fits the classic cadences', () => {
    for (const { id, e } of songs) {
      const chords = harmonize(e);
      const tonic = melodyKey(e.bars);
      // a song that stops on the home note ends on the home chord
      if (e.bars.flat().at(-1)!.midi % 12 === tonic) expect(chords.at(-1)!.root, id).toBe(tonic);
    }
    // «Hänschen klein»: G E E | F D D – the second bar is the dominant
    const haenschen = songs.find((s) => s.id === 'song-haenschen')!.e;
    expect(harmonize(haenschen)[1]!.root).toBe(7);
  });

  it('plays in time with the melody and stays below a right-hand tune', () => {
    for (const { id, e } of songs) {
      const events = accompaniment(e);
      const total = e.bars.flat().reduce((n, x) => n + beatsOf(x.value), 0);
      expect(events.length, id).toBeGreaterThan(0);
      for (const ev of events) {
        expect(ev.at + ev.beats, id).toBeLessThanOrEqual(total + 1e-9);
        if (e.clef === 'treble') {
          const top = Math.min(...e.bars.flat().map((n) => n.midi));
          expect(Math.max(...ev.midis), id).toBeLessThanOrEqual(top);
        }
      }
    }
  });

  it('leaves an upbeat alone', () => {
    const birthday = songs.find((s) => s.id === 'meter-upbeat')!.e;
    expect(accompaniment(birthday)[0]!.at).toBe(birthday.pickup);
  });
});
