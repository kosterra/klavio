import { describe, expect, it } from 'vitest';
import {
  frequencyToNote,
  isBlackKey,
  midiToFrequency,
  midiToName,
  midiToPitchName,
  noteNameToMidi,
} from './notes.ts';

describe('notes', () => {
  it('converts A4 and middle C', () => {
    expect(midiToFrequency(69)).toBe(440);
    expect(midiToFrequency(60)).toBeCloseTo(261.626, 2);
  });

  it('respects a custom concert pitch', () => {
    expect(midiToFrequency(69, 443)).toBe(443);
    expect(frequencyToNote(443, 443)).toEqual({ midi: 69, cents: 0 });
  });

  it('maps frequency to nearest note with cents', () => {
    expect(frequencyToNote(261.626)).toEqual({ midi: 60, cents: 0 });
    // 30 cents sharp of A4
    expect(frequencyToNote(440 * 2 ** (30 / 1200))).toEqual({ midi: 69, cents: 30 });
  });

  it('names notes in German and English', () => {
    expect(midiToName(60)).toBe('C4');
    expect(midiToName(71)).toBe('H4');
    expect(midiToName(71, 'en')).toBe('B4');
    expect(midiToName(61)).toBe('Cis4');
    expect(midiToName(21)).toBe('A0');
  });

  it('detects black keys', () => {
    expect(isBlackKey(60)).toBe(false);
    expect(isBlackKey(61)).toBe(true);
    expect(isBlackKey(70)).toBe(true);
  });

  it('parses note names', () => {
    expect(noteNameToMidi('C4')).toBe(60);
    expect(noteNameToMidi('A4')).toBe(69);
    expect(noteNameToMidi('F#3')).toBe(54);
    expect(noteNameToMidi('Bb4')).toBe(70);
    expect(noteNameToMidi('H4')).toBe(71);
    expect(() => noteNameToMidi('X4')).toThrow();
    for (let m = 21; m <= 108; m++) {
      if (!isBlackKey(m)) expect(noteNameToMidi(midiToName(m, 'en'))).toBe(m);
    }
  });

  it('names pitch classes in German and English', () => {
    expect(midiToPitchName(71)).toBe('H');
    expect(midiToPitchName(71, 'en')).toBe('B');
    expect(midiToPitchName(48)).toBe('C');
  });
});
