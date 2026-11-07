import { describe, expect, it } from 'vitest';
import {
  CURRICULUM,
  LESSONS,
  isLessonUnlocked,
  lessonTargetCount,
  nextLesson,
} from './curriculum.ts';
import { addDays, levelForXp, nextStreak, starsFor, xpFor, xpForLevel } from './rewards.ts';

describe('curriculum data', () => {
  it('has unique, stable-looking ids', () => {
    const ids = [...CURRICULUM.map((c) => c.id), ...LESSONS.map((l) => l.id)];
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/);
  });

  it('is translated, in Swiss spelling', () => {
    for (const item of [...CURRICULUM, ...LESSONS]) {
      for (const text of Object.values(item.title)) expect(text.trim()).not.toBe('');
      expect(item.title['de-CH']).not.toContain('ß');
    }
    for (const l of LESSONS) {
      expect(l.intro['de-CH']).not.toContain('ß');
      expect(l.intro.en.trim()).not.toBe('');
    }
  });

  it('only asks for keys that are on the visible keyboard', () => {
    for (const l of LESSONS) {
      for (const e of l.exercises) {
        const notes =
          e.type === 'play-along'
            ? e.sequences.flat()
            : e.type === 'song'
              ? e.bars.flat().map((n) => n.midi)
              : e.type === 'rhythm'
                ? [e.midi]
                : e.notes;
        for (const n of notes) {
          if (e.type === 'find-key' && e.anyOctave) {
            // some octave of the pitch class must be visible
            const visible = Array.from(
              { length: l.keyboard.to - l.keyboard.from + 1 },
              (_, i) => l.keyboard.from + i,
            );
            expect(
              visible.some((m) => m % 12 === n % 12),
              `${l.id} ${n}`,
            ).toBe(true);
          } else {
            expect(n, `${l.id} ${n}`).toBeGreaterThanOrEqual(l.keyboard.from);
            expect(n, `${l.id} ${n}`).toBeLessThanOrEqual(l.keyboard.to);
          }
        }
      }
      expect(lessonTargetCount(l)).toBeGreaterThan(0);
    }
  });

  it('unlocks lessons in order', () => {
    const first = LESSONS[0]!.id;
    const second = LESSONS[1]!.id;
    expect(isLessonUnlocked(first, new Set())).toBe(true);
    expect(isLessonUnlocked(second, new Set())).toBe(false);
    expect(isLessonUnlocked(second, new Set([first]))).toBe(true);
    expect(isLessonUnlocked('nope', new Set())).toBe(false);
    expect(nextLesson(new Set([first])).id).toBe(second);
    expect(nextLesson(new Set(LESSONS.map((l) => l.id))).id).toBe(LESSONS.at(-1)!.id);
  });
});

describe('song notation', () => {
  it('parses notes, values and bars and checks full bars', async () => {
    const { parseSong, beatsOf } = await import('./song.ts');
    expect(parseSong('C4/q D4/q E4/h | G4/w', '4/4')).toEqual([
      [
        { midi: 60, value: 'q' },
        { midi: 62, value: 'q' },
        { midi: 64, value: 'h' },
      ],
      [{ midi: 67, value: 'w' }],
    ]);
    expect(beatsOf('qd') + beatsOf('8')).toBe(2);
    expect(() => parseSong('C4/q D4/q', '4/4')).toThrow(/Bar 1 has 2 beats/);
    expect(() => parseSong('C4/x D4/q', '2/4')).toThrow(/Unknown note value/);
    expect(parseSong('C4/q D4/q | E4/h', '2/4')).toHaveLength(2);
  });

  it('parses rhythms with rests and finds the onsets', async () => {
    const { rhythm, rhythmOnsets } = await import('./song.ts');
    const r = rhythm('q q qr q | h hr');
    expect(r.patterns).toEqual([
      ['q', 'q', 'qr', 'q'],
      ['h', 'hr'],
    ]);
    expect(rhythmOnsets(r.patterns[0]!)).toEqual([0, 1, 3]);
    expect(rhythmOnsets(['qd', '8', 'h'])).toEqual([0, 1.5, 2]);
    expect(() => rhythm('q q q')).toThrow(/3 beats/);
  });
});

describe('rewards', () => {
  it('gives stars by accuracy, always at least one', () => {
    expect(starsFor(10, 0)).toBe(3);
    expect(starsFor(10, 1)).toBe(3); // 90.9 %
    expect(starsFor(10, 3)).toBe(2); // 76.9 %
    expect(starsFor(10, 4)).toBe(1);
    expect(starsFor(5, 50)).toBe(1);
  });

  it('gives full XP the first time and still rewards practice', () => {
    expect(xpFor(10, 3, 0)).toBe(25);
    expect(xpFor(10, 2, 3)).toBe(5);
    expect(xpFor(10, 3, 1)).toBe(15);
  });

  it('maps XP to levels', () => {
    expect([0, 49, 50, 149, 150, 300, 500].map(levelForXp)).toEqual([1, 1, 2, 2, 3, 4, 5]);
    expect(xpForLevel(levelForXp(1234))).toBeLessThanOrEqual(1234);
  });

  it('keeps, extends or restarts the streak', () => {
    const s = { current: 3, longest: 5, lastActiveDate: '2026-11-06' };
    expect(nextStreak(s, '2026-11-06')).toBe(s);
    expect(nextStreak(s, '2026-11-07')).toEqual({
      current: 4,
      longest: 5,
      lastActiveDate: '2026-11-07',
    });
    expect(nextStreak(s, '2026-11-09')).toEqual({
      current: 1,
      longest: 5,
      lastActiveDate: '2026-11-09',
    });
    expect(nextStreak({ current: 0, longest: 0, lastActiveDate: null }, '2026-01-01').current).toBe(
      1,
    );
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-03-01', -1)).toBe('2028-02-29');
  });
});
