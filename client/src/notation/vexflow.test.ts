import { describe, expect, it } from 'vitest';
import { accidentalFor, midiToVexKey } from './vexflow';

describe('accidentals and key signatures', () => {
  it('spells black keys with sharps or flats', () => {
    expect(midiToVexKey(70)).toBe('a#/4');
    expect(midiToVexKey(70, 'flat')).toBe('bb/4');
  });

  it('leaves out what the key signature already says', () => {
    expect(accidentalFor(66, 'sharp', 'G')).toBeNull(); // F♯ in G major
    expect(accidentalFor(70, 'flat', 'F')).toBeNull(); // B♭ in F major
    expect(accidentalFor(65, 'sharp', 'G')).toBe('n'); // F natural in G major
    expect(accidentalFor(71, 'flat', 'F')).toBe('n'); // B natural in F major
    expect(accidentalFor(63, 'flat', 'C')).toBe('b'); // E♭ without key signature
    expect(accidentalFor(60, 'sharp', 'G')).toBeNull();
  });
});
