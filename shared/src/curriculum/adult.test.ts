import { describe, expect, it } from 'vitest';
import { LESSONS, lessonFor } from './curriculum.ts';
import { ADULT_THEORY_STEPS, theoryFor } from './theory.ts';
import { songNotes } from './song.ts';

const adults = LESSONS.filter((l) => l.adult);

describe('grown-ups play pieces instead of children’s songs', () => {
  it('has a piece for the children’s songs', () => {
    expect(adults.map((l) => l.id)).toEqual(
      expect.arrayContaining(['hand-entchen', 'song-haenschen', 'bass-lamb', 'both-entchen']),
    );
  });

  it('keeps the kind of exercise, the keys and the length', () => {
    for (const l of adults) {
      const a = lessonFor(l, 'journey');
      expect(a.title, l.id).not.toEqual(l.title);
      expect(
        a.exercises.map((e) => e.type),
        l.id,
      ).toEqual(l.exercises.map((e) => e.type));
      for (const e of a.exercises) {
        const notes =
          e.type === 'song'
            ? songNotes(e).map((n) => n.midi)
            : e.type === 'piece'
              ? e.bars
                  .flatMap((b) => [...b.rh, ...b.lh])
                  .flatMap((n) => (n.midi === null ? [] : [n.midi]))
              : [];
        for (const m of notes) {
          expect(m, l.id).toBeGreaterThanOrEqual(l.keyboard.from);
          expect(m, l.id).toBeLessThanOrEqual(l.keyboard.to);
        }
      }
    }
    // children keep their songs
    for (const l of adults) expect(lessonFor(l, 'kids')).toBe(l);
  });

  it('tells about the piece in «Entdecken», step for step', () => {
    for (const [id, steps] of Object.entries(ADULT_THEORY_STEPS)) {
      const kids = theoryFor(id, 'kids');
      const adult = theoryFor(id, 'journey');
      expect(adult.length, id).toBe(kids.length);
      for (const i of steps) {
        expect(adult[i]!.type, `${id} ${i}`).toBe(kids[i]!.type);
        expect(adult[i], `${id} ${i}`).not.toEqual(kids[i]);
      }
    }
  });
});
