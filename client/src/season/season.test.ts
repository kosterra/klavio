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

  it('changes something every day – pieces come, visitors come and go', () => {
    for (const year of [2025, 2026, 2027, 2028, 2029, 2030]) {
      const start = firstAdvent(year);
      let before: string | null = null;
      for (let t = new Date(start); t <= new Date(year, 11, 26); t.setDate(t.getDate() + 1)) {
        const s = seasonAt(new Date(t.getFullYear(), t.getMonth(), t.getDate(), 12));
        const now = ADVENT_PIECES.filter((p) => hasPiece(s, p)).join(',');
        expect(now, `${t.toDateString()}`).not.toBe(before);
        before = now;
      }
    }
  });

  it('brings Samichlaus on the 6th and the sleigh on Christmas Eve', () => {
    expect(hasPiece(seasonAt(d('2026-12-06')), 'samichlaus')).toBe(true);
    expect(hasPiece(seasonAt(d('2026-12-07')), 'samichlaus')).toBe(false);
    expect(hasPiece(seasonAt(d('2026-12-07')), 'sack')).toBe(true);
    // the snowman melts and a new one is built
    expect(hasPiece(seasonAt(d('2026-12-10')), 'snowman')).toBe(true);
    expect(hasPiece(seasonAt(d('2026-12-12')), 'snowman')).toBe(false);
    expect(hasPiece(seasonAt(d('2026-12-16')), 'snowman')).toBe(true);
    const eve = seasonAt(d('2026-12-24'));
    expect(eve.phase).toBe('christmas');
    expect(
      ['santa', 'star', 'tree', 'gifts', 'bethlehem'].every((p) => hasPiece(eve, p as never)),
    ).toBe(true);
    expect(hasPiece(eve, 'sled')).toBe(false); // it's flying
    expect(hasPiece(seasonAt(d('2026-12-25')), 'santa')).toBe(false);
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
