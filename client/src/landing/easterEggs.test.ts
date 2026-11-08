// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { tapCounter, tuneMatcher } from './easterEggs';

describe('easter egg helpers', () => {
  it('recognises a tune in any octave, also after wrong notes', () => {
    const match = tuneMatcher([60, 62, 64]);
    expect([61, 60, 62].map(match)).toEqual([false, false, false]);
    expect(match(76)).toBe(true); // E5 – same pitch class as E4
    expect(match(60)).toBe(false); // starts over after a hit
  });

  it('counts quick taps only', () => {
    const tap = tapCounter(3);
    expect([tap(), tap(), tap()]).toEqual([false, false, true]);
    expect(tap()).toBe(false);
  });
});
