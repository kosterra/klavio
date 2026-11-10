import { describe, expect, it } from 'vitest';
import { ADVENT_PIECES, firstAdvent, hasPiece, seasonAt } from './season';

const d = (s: string) => new Date(`${s}T12:00:00`);

describe('the festive season', () => {
  it('starts on the first Sunday of Advent', () => {
    expect(firstAdvent(2026)).toEqual(new Date(2026, 10, 29));
    expect(firstAdvent(2022)).toEqual(new Date(2022, 10, 27));
    expect(firstAdvent(2025)).toEqual(new Date(2025, 10, 30));
    expect(seasonAt(d('2026-11-28')).phase).toBe('none');
    const first = seasonAt(new Date(2026, 10, 29, 0, 5));
    expect(first.phase).toBe('advent');
    expect(hasPiece(first, 'wreath')).toBe(true);
    expect(hasPiece(first, 'tree')).toBe(false);
  });

  it('brings one more piece every few days, all of them on Christmas Eve', () => {
    let before = 0;
    for (let day = 29; day <= 55; day++) {
      const date = new Date(2026, 10, day, 12);
      const s = seasonAt(date);
      const n = ADVENT_PIECES.filter((p) => hasPiece(s, p)).length;
      expect(n).toBeGreaterThanOrEqual(before);
      before = n;
    }
    const eve = seasonAt(d('2026-12-24'));
    expect(eve.phase).toBe('christmas');
    expect(ADVENT_PIECES.every((p) => hasPiece(eve, p))).toBe(true);
    expect(seasonAt(d('2026-12-26')).phase).toBe('christmas');
  });

  it('lights one more candle every Advent Sunday', () => {
    const candles = (s: string) => {
      const x = seasonAt(d(s));
      return x.phase === 'advent' || x.phase === 'christmas' ? x.candles : 0;
    };
    expect(candles('2026-11-29')).toBe(1);
    expect(candles('2026-12-05')).toBe(1);
    expect(candles('2026-12-06')).toBe(2);
    expect(candles('2026-12-13')).toBe(3);
    expect(candles('2026-12-20')).toBe(4);
    expect(candles('2026-12-25')).toBe(4);
  });

  it('celebrates the New Year and then goes back to normal', () => {
    expect(seasonAt(d('2026-12-27'))).toEqual({
      phase: 'newyear',
      fireworks: false,
      greeting: 'soon',
      year: 2027,
    });
    expect(seasonAt(d('2026-12-31'))).toMatchObject({
      fireworks: true,
      greeting: 'eve',
      year: 2027,
    });
    expect(seasonAt(d('2027-01-01'))).toMatchObject({
      fireworks: true,
      greeting: 'new',
      year: 2027,
    });
    expect(seasonAt(d('2027-01-02')).phase).toBe('none');
    expect(seasonAt(d('2027-07-01')).phase).toBe('none');
  });
});
