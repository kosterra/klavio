import { describe, expect, it } from 'vitest';
import { intervalPairs, staffSteps, whiteStep } from './intervals.ts';
import { sightMelody, sightNoteCount, sightRhythm } from './sightReading.ts';
import { noteNameToMidi as n } from '../music/notes.ts';

describe('intervals on the staff', () => {
  it('counts steps on the white keys, over the black ones', () => {
    expect(whiteStep(n('C4'), 1)).toBe(n('D4'));
    expect(whiteStep(n('E4'), 1)).toBe(n('F4'));
    expect(whiteStep(n('C4'), 2)).toBe(n('E4'));
    expect(whiteStep(n('C4'), 4)).toBe(n('G4'));
    expect(whiteStep(n('C4'), -2)).toBe(n('A3'));
    expect(() => whiteStep(n('C#4'), 1)).toThrow();
    expect(staffSteps(n('G4'), n('C4'))).toBe(4);
    expect(staffSteps(n('E4'), n('F4'))).toBe(1);
  });

  it('finds every pair up and down inside the keys given', () => {
    const keys = ['C4', 'D4', 'E4'].map(n);
    expect(intervalPairs(keys, [1])).toEqual([
      [60, 62],
      [62, 64],
      [62, 60],
      [64, 62],
    ]);
    const thirds = intervalPairs(['C4', 'D4', 'E4', 'F4', 'G4'].map(n), [2]);
    expect(thirds.every(([a, b]) => staffSteps(a, b) === 2)).toBe(true);
    expect(thirds).toHaveLength(6);
  });
});

describe('sight-reading melodies', () => {
  const e = {
    notes: ['C4', 'D4', 'E4', 'F4', 'G4'].map(n),
    rhythms: ['q q q q | h h', 'h q q | q q h'],
    time: '4/4',
  };

  it('reads rhythms without pitches and counts their notes', () => {
    expect(sightRhythm('h q q | w', '4/4').map((b) => b.map((x) => x.value))).toEqual([
      ['h', 'q', 'q'],
      ['w'],
    ]);
    expect(sightNoteCount(e)).toBe(6);
    expect(() => sightRhythm('q q q', '4/4')).toThrow(/3 beats/);
  });

  it('makes melodies that move by step or skip and end on the tonic', () => {
    // a fixed sequence of «random» numbers: the same melody each time
    for (let seed = 1; seed < 200; seed++) {
      let x = seed;
      const random = () => (x = (x * 9301 + 49297) % 233280) / 233280;
      const melody = sightMelody(e, random);
      const notes = melody.flat();
      expect(notes).toHaveLength(6);
      expect(notes.at(-1)!.midi).toBe(n('C4'));
      for (const note of notes) expect(e.notes).toContain(note.midi);
      for (let i = 1; i < notes.length; i++) {
        expect(staffSteps(notes[i - 1]!.midi, notes[i]!.midi)).toBeLessThanOrEqual(2);
      }
      // never the same key three times in a row
      for (let i = 2; i < notes.length - 1; i++) {
        const same = notes[i]!.midi === notes[i - 1]!.midi && notes[i]!.midi === notes[i - 2]!.midi;
        expect(same).toBe(false);
      }
    }
  });

  it('comes home to the tonic given', () => {
    const g = sightMelody({ ...e, tonic: n('G4') }, () => 0.5);
    expect(g.flat().at(-1)!.midi).toBe(n('G4'));
  });
});
