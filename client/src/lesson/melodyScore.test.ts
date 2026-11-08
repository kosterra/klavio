import { describe, expect, it } from 'vitest';
import { scoreMelody } from './rhythmScore';

describe('scoreMelody («Im Takt»)', () => {
  const song = [
    { ms: 0, midi: 60 },
    { ms: 500, midi: 62 },
    { ms: 1000, midi: 64 },
  ];

  it('counts the right key at the right time', () => {
    const s = scoreMelody(
      song,
      [
        { ms: 10, midi: 60 },
        { ms: 560, midi: 62 },
        { ms: 1150, midi: 64 },
      ],
      200,
    );
    expect(s.perNote).toEqual(['ok', 'ok', 'late']);
    expect(s.missed).toBe(0);
  });

  it('a wrong key or a note far off the beat does not count', () => {
    const s = scoreMelody(
      song,
      [
        { ms: 0, midi: 61 },
        { ms: 900, midi: 62 },
        { ms: 1000, midi: 64 },
      ],
      200,
    );
    expect(s.perNote).toEqual(['missed', 'missed', 'ok']);
    expect(s.wrong).toBe(1);
    expect(s.extra).toBe(1);
  });
});
