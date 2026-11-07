/** MIDI / frequency helpers shared by pitch detection, exercises and notation. */

export const NOTE_NAMES_DE = ['C', 'Cis', 'D', 'Dis', 'E', 'F', 'Fis', 'G', 'Gis', 'A', 'Ais', 'H'];
export const NOTE_NAMES_EN = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const MIDI_A4 = 69;
export const MIDI_MIDDLE_C = 60;
export const PIANO_LOWEST_MIDI = 21; // A0
export const PIANO_HIGHEST_MIDI = 108; // C8

export function midiToFrequency(midi: number, a4Hz = 440): number {
  return a4Hz * 2 ** ((midi - MIDI_A4) / 12);
}

/** Fractional MIDI number for a frequency (e.g. 60.12 = C4 + 12 cents). */
export function frequencyToMidiFloat(freq: number, a4Hz = 440): number {
  return MIDI_A4 + 12 * Math.log2(freq / a4Hz);
}

export function frequencyToNote(freq: number, a4Hz = 440): { midi: number; cents: number } {
  const exact = frequencyToMidiFloat(freq, a4Hz);
  const midi = Math.round(exact);
  return { midi, cents: Math.round((exact - midi) * 100) };
}

/** Scientific pitch notation, German names by default: 60 → "C4". */
export function midiToName(midi: number, locale: 'de' | 'en' = 'de'): string {
  const names = locale === 'de' ? NOTE_NAMES_DE : NOTE_NAMES_EN;
  const octave = Math.floor(midi / 12) - 1;
  return `${names[((midi % 12) + 12) % 12]}${octave}`;
}

export function isBlackKey(midi: number): boolean {
  return [1, 3, 6, 8, 10].includes(((midi % 12) + 12) % 12);
}

const PITCH_CLASS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11, H: 11 };

/** "C4" → 60, "F#3" → 54, "Bb4" → 70. German "H" is accepted as B. */
export function noteNameToMidi(name: string): number {
  const m = /^([A-H])(#|b)?(-?\d)$/.exec(name.trim());
  if (!m) throw new Error(`Invalid note name: ${name}`);
  const [, letter, accidental, octave] = m;
  const shift = accidental === '#' ? 1 : accidental === 'b' ? -1 : 0;
  return (Number(octave) + 1) * 12 + PITCH_CLASS[letter!]! + shift;
}

/** Note name without octave in the learner's language: 60 → "C", 71 → "H" (de) / "B" (en). */
export function midiToPitchName(midi: number, locale: 'de' | 'en' = 'de'): string {
  const names = locale === 'de' ? NOTE_NAMES_DE : NOTE_NAMES_EN;
  return names[((midi % 12) + 12) % 12]!;
}
