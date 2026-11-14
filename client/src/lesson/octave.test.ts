import { describe, expect, it } from 'vitest';
import { octaveOff } from './exercises';

describe('octaveOff', () => {
  it('names the right note in the wrong octave', () => {
    expect(octaveOff(60, 72)).toBe('low'); // C4 for C5
    expect(octaveOff(84, 72)).toBe('high');
    expect(octaveOff(48, 72)).toBe('low'); // two octaves
  });

  it('is nothing for the right note or another note', () => {
    expect(octaveOff(72, 72)).toBeNull();
    expect(octaveOff(71, 72)).toBeNull();
    expect(octaveOff(62, 72)).toBeNull();
  });
});
