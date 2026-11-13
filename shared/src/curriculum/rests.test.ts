import { describe, expect, it } from 'vitest';
import { harmonize } from './harmony.ts';
import { isStruck, parseSong, song, staffDuration } from './song.ts';
import { songFingers } from './songFingering.ts';
import { lessonTargetCount } from './curriculum.ts';
import { songExerciseSchema } from '../schemas/pieces.ts';
import type { Lesson } from './types.ts';

describe('rests in songs', () => {
  it('are written "r/<value>", fill the bar, and are drawn as rests', () => {
    const bars = parseSong('C4/q r/q E4/h | r/w', '4/4');
    expect(bars[0]![1]).toEqual({ midi: -1, value: 'q', rest: true });
    expect(staffDuration(bars[0]![1]!)).toBe('qr');
    expect(staffDuration(bars[0]![0]!)).toBe('q');
    expect(() => parseSong('C4/q r/qd D4/8 E4/h', '4/4')).toThrow(/Unknown rest/);
    expect(() => parseSong('C4/h r/h~ | r/w', '4/4')).toThrow(/Unknown rest/);
    // a tie cannot lead into a rest
    expect(() => parseSong('C4/h~ r/h', '4/4')).toThrow(/tie/);
  });

  it('are not struck and do not count for the stars', () => {
    const e = song('C4/q r/q E4/h~ | E4/h r/8 G4/8 r/q', { tempo: 90 });
    const notes = e.bars.flat();
    expect(notes.map((_, i) => isStruck(notes, i))).toEqual([
      true,
      false,
      true,
      false, // held
      false,
      true,
      false,
    ]);
    const lesson = { exercises: [e] } as unknown as Lesson;
    expect(lessonTargetCount(lesson)).toBe(3);
  });

  it('get no finger and stay out of the fingering plan', () => {
    const e = song('C4/q r/q G4/q r/q | C5/q r/q G5/q r/q | C4/w', { tempo: 90 });
    const fingers = songFingers(e);
    const notes = e.bars.flat();
    notes.forEach((n, i) => {
      if (n.rest) expect(fingers[i]).toBeUndefined();
    });
    expect(fingers.some((f) => f !== undefined)).toBe(true);
  });

  it('take time in the accompaniment but have no pitch', () => {
    const e = song('r/h G4/h | C4/w', { tempo: 90 });
    const chords = harmonize(e);
    expect(chords.at(-1)!.root).toBe(0); // ends at home, on C
    expect(chords.every((c) => c.root >= 0 && c.root < 12)).toBe(true);
  });

  it('are valid in a saved own piece – a note with -1 is not', () => {
    const e = song('C4/q r/q E4/h', { tempo: 90 });
    expect(songExerciseSchema.safeParse(e).success).toBe(true);
    const bad = { ...e, bars: [[{ midi: -1, value: 'q' }, ...e.bars[0]!.slice(1)]] };
    expect(songExerciseSchema.safeParse(bad).success).toBe(false);
  });
});
