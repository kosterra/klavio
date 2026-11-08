import { describe, expect, it } from 'vitest';
import { isChristmasSeason } from './worlds';

const d = (s: string) => new Date(`${s}T12:00:00`);

describe('isChristmasSeason', () => {
  it('starts on the first Sunday of Advent', () => {
    // 2026: Christmas is a Friday → 1st Advent 29 November
    expect(isChristmasSeason(d('2026-11-28'))).toBe(false);
    expect(isChristmasSeason(new Date(2026, 10, 29, 0, 0))).toBe(true);
    // 2022: Christmas is a Sunday → 1st Advent 27 November
    expect(isChristmasSeason(d('2022-11-26'))).toBe(false);
    expect(isChristmasSeason(d('2022-11-27'))).toBe(true);
    // 2025: Christmas is a Thursday → 1st Advent 30 November
    expect(isChristmasSeason(d('2025-11-29'))).toBe(false);
    expect(isChristmasSeason(d('2025-11-30'))).toBe(true);
  });

  it('ends after 26 December', () => {
    expect(isChristmasSeason(d('2026-12-26'))).toBe(true);
    expect(isChristmasSeason(new Date(2026, 11, 26, 23, 59))).toBe(true);
    expect(isChristmasSeason(d('2026-12-27'))).toBe(false);
    expect(isChristmasSeason(d('2026-01-05'))).toBe(false);
    expect(isChristmasSeason(d('2026-07-01'))).toBe(false);
  });
});
