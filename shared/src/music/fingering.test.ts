import { describe, expect, it } from 'vitest';
import { fingeringMarks, planFingering } from './fingering.ts';
import { LESSONS } from '../curriculum/curriculum.ts';

const C4 = 60;
const D4 = 62;
const E4 = 64;
const F4 = 65;
const G4 = 67;
const A4 = 69;

describe('fingering', () => {
  it('a five-finger tune stays in one position: thumb on C', () => {
    expect(planFingering([C4, D4, E4, F4, G4].map((midi) => ({ midi })))).toEqual([1, 2, 3, 4, 5]);
    // only the first note gets a number – the hand does not move
    expect(fingeringMarks([C4, E4, G4, E4, C4].map((midi) => ({ midi })))).toEqual([
      1,
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
  });

  it('a tune beyond five keys moves the hand once, with a number where it moves', () => {
    // «Alle meine Entchen»: C D E F G G A A A A G …
    const tune = [C4, D4, E4, F4, G4, G4, A4, A4, A4, A4, G4].map((midi) => ({ midi }));
    const marks = fingeringMarks(tune);
    expect(marks.filter((m) => m !== undefined).length).toBe(2);
    for (const f of planFingering(tune)) expect(f).toBeGreaterThanOrEqual(1);
  });

  it('the left hand counts from the top: thumb on the highest key', () => {
    expect(
      planFingering(
        [48, 50, 52, 53, 55].map((midi) => ({ midi })),
        'lh',
      ),
    ).toEqual([5, 4, 3, 2, 1]);
  });

  it('every song of the course gets a playable plan', () => {
    for (const l of LESSONS) {
      for (const e of l.exercises) {
        if (e.type !== 'song') continue;
        const notes = e.bars.flat().map((n) => ({ midi: n.midi }));
        const f = planFingering(notes, e.clef === 'bass' ? 'lh' : 'rh');
        expect(f.every((x) => x >= 1 && x <= 5)).toBe(true);
      }
    }
  });
});
