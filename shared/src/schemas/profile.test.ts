import { describe, expect, it } from 'vitest';
import { birthYearSchema, canChooseWorld, effectiveWorld } from './profile.ts';

describe('worlds by age', () => {
  const year = 2026;
  it('lets profiles from the minimum age on choose', () => {
    expect(canChooseWorld(2014, 12, year)).toBe(true); // turns 12 this year
    expect(canChooseWorld(2015, 12, year)).toBe(false);
    expect(canChooseWorld(null, 12, year)).toBe(false);
  });

  it('gives younger ones the kids’ worlds, whatever was chosen', () => {
    expect(effectiveWorld({ birthYear: 2018, world: 'journey', uiMode: 'classic' }, 12, year)).toBe(
      'kids',
    );
  });

  it('follows the choice, or the view when nothing was chosen', () => {
    const adult = { birthYear: 1985, uiMode: 'classic' } as const;
    expect(effectiveWorld({ ...adult, world: null }, 12, year)).toBe('journey');
    expect(effectiveWorld({ ...adult, world: 'kids' }, 12, year)).toBe('kids');
    expect(effectiveWorld({ ...adult, uiMode: 'kids', world: null }, 12, year)).toBe('kids');
  });

  it('keeps what profiles without a birth year had', () => {
    expect(effectiveWorld({ birthYear: null, world: null, uiMode: 'classic' }, 12, year)).toBe(
      'journey',
    );
  });

  it('accepts no birth year in the future', () => {
    expect(birthYearSchema.safeParse(new Date().getFullYear() + 1).success).toBe(false);
    expect(birthYearSchema.safeParse(1899).success).toBe(false);
    expect(birthYearSchema.safeParse(2016).success).toBe(true);
  });
});
