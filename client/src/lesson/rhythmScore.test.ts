// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { inputLatency, scoreMelody, scoreRhythm } from './rhythmScore';

describe('rhythm scoring', () => {
  const beats = [0, 500, 1000, 1500];

  it('accepts notes within the tolerance and grades them', () => {
    const r = scoreRhythm(beats, [10, 470, 1120, 1530], 150);
    expect(r.perNote).toEqual(['ok', 'ok', 'late', 'ok']);
    expect(r.missed).toBe(0);
    expect(r.extra).toBe(0);
    expect(r.deltas).toEqual([10, -30, 120, 30]);
  });

  it('counts missed and extra notes', () => {
    const r = scoreRhythm(beats, [0, 250, 1000, 1010], 150);
    expect(r.perNote).toEqual(['ok', 'missed', 'ok', 'missed']);
    expect(r.extra).toBe(2); // 250 is too far from any beat, 1010 is a double tap
    expect(r.missed).toBe(2);
  });

  it('uses each played note only once and picks the nearest', () => {
    const r = scoreRhythm([0, 200], [110], 150);
    expect(r.perNote).toEqual(['missed', 'early']); // 90 ms before the second beat
    expect(r.extra).toBe(0);
  });

  it('flags early notes', () => {
    expect(scoreRhythm([1000], [880], 150).perNote).toEqual(['early']);
  });
});

describe('inputLatency', () => {
  const song = [0, 500, 1000, 1500, 2000].map((ms, i) => ({ ms, midi: 60 + i }));

  it('finds the delay that is the same for every note', () => {
    const jitter = [-30, 10, 0, 20, -10];
    const played = song.map((x, i) => ({ ms: x.ms + 230 + jitter[i]!, midi: x.midi }));
    expect(inputLatency(song, played)).toBe(230);
    // with it taken out, every note is in time
    const shifted = played.map((p) => ({ ...p, ms: p.ms - inputLatency(song, played) }));
    expect(scoreMelody(song, shifted, 160).perNote.every((v) => v === 'ok')).toBe(true);
  });

  it('takes nothing out without enough notes, and never more than the limit', () => {
    expect(
      inputLatency(
        song,
        song.slice(0, 2).map((x) => ({ ...x, ms: x.ms + 200 })),
      ),
    ).toBe(0);
    expect(
      inputLatency(
        song,
        song.map((x) => ({ ...x, ms: x.ms + 520 })),
      ),
    ).toBe(400);
  });

  it('does not reward playing early', () => {
    expect(
      inputLatency(
        song,
        song.map((x) => ({ ...x, ms: x.ms - 120 })),
      ),
    ).toBe(0);
  });
});
