/**
 * Computer keyboard as piano: the home row are the white keys, the row above the
 * black ones (like on a piano). Uses `KeyboardEvent.code`, i.e. the physical
 * position, so it works the same on Swiss QWERTZ and US QWERTY layouts.
 */
const CODE_TO_SEMITONE: Record<string, number> = {
  KeyA: 0, // C
  KeyW: 1,
  KeyS: 2, // D
  KeyE: 3,
  KeyD: 4, // E
  KeyF: 5, // F
  KeyT: 6,
  KeyG: 7, // G
  KeyY: 8, // "Z" on QWERTZ
  KeyH: 9, // A
  KeyU: 10,
  KeyJ: 11, // B/H
  KeyK: 12, // C'
  KeyO: 13,
  KeyL: 14, // D'
  KeyP: 15,
  Semicolon: 16, // E' ("Ö" on QWERTZ)
};

/** MIDI note for a key press, relative to `baseMidi` (a C), or null. */
export function midiForKeyCode(code: string, baseMidi: number): number | null {
  const semitone = CODE_TO_SEMITONE[code];
  return semitone === undefined ? null : baseMidi + semitone;
}

/** Label shown on the screen key for a given offset from the base C (layout-aware via `KeyboardLayoutMap` when available). */
export const SEMITONE_TO_CODE: Record<number, string> = Object.fromEntries(
  Object.entries(CODE_TO_SEMITONE).map(([code, s]) => [s, code]),
);
