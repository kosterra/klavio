import { beforeEach, describe, expect, it } from 'vitest';
import { forgetAccount } from './forget';
import { KEYS } from './storage';

describe('logging out on a shared device', () => {
  beforeEach(() => localStorage.clear());

  it("forgets the account's unsent results and its profiles' settings, keeps the device's", () => {
    localStorage.setItem(
      KEYS.queue,
      JSON.stringify([
        { id: '1', userId: 'me', profileId: 'p1' },
        { id: '2', userId: 'other', profileId: 'q1' },
      ]),
    );
    localStorage.setItem('klavio-read-aloud', JSON.stringify({ p1: true, q1: false }));
    localStorage.setItem('klavio-worlds-revealed', JSON.stringify({ p1: ['keys'], q1: ['hand'] }));
    localStorage.setItem('klavio-mic-hint-hidden', JSON.stringify(['p1', 'q1']));
    localStorage.setItem('klavio-rain-best:p1', '{"treble-few":12}');
    localStorage.setItem('klavio-play-on:p1', 'screen');
    localStorage.setItem('klavio-language', 'de-CH');

    forgetAccount('me', ['p1']);

    expect(JSON.parse(localStorage.getItem(KEYS.queue)!)).toEqual([
      { id: '2', userId: 'other', profileId: 'q1' },
    ]);
    expect(JSON.parse(localStorage.getItem('klavio-read-aloud')!)).toEqual({ q1: false });
    expect(JSON.parse(localStorage.getItem('klavio-worlds-revealed')!)).toEqual({ q1: ['hand'] });
    expect(JSON.parse(localStorage.getItem('klavio-mic-hint-hidden')!)).toEqual(['q1']);
    expect(localStorage.getItem('klavio-rain-best:p1')).toBeNull();
    expect(localStorage.getItem('klavio-play-on:p1')).toBeNull();
    expect(localStorage.getItem('klavio-language')).toBe('de-CH');
  });
});
