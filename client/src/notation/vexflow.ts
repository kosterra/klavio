import type * as VF from 'vexflow';
import { KEY_SIGNATURE_ALTERS, spellingOf, type KeySignature, type Spelling } from '@klavio/shared';

type VexFlowModule = typeof VF;
let loading: Promise<VexFlowModule> | null = null;

/**
 * Loads VexFlow (with the Bravura music font embedded — no CDN request) only
 * when notation is needed, and waits until the font is ready to draw.
 */
export function loadVexFlow(): Promise<VexFlowModule> {
  loading ??= import('vexflow/bravura').then(async (mod) => {
    if (typeof document !== 'undefined' && document.fonts) {
      await document.fonts.load('30px Bravura').catch(() => undefined);
    }
    return mod as unknown as VexFlowModule;
  });
  return loading;
}

const KEYS = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];
const KEYS_FLAT = ['c', 'db', 'd', 'eb', 'e', 'f', 'gb', 'g', 'ab', 'a', 'bb', 'b'];
const BLACK = [1, 3, 6, 8, 10];

/** 61 → "c#/4" (or "db/4" spelled with flats) – VexFlow key notation. */
export function midiToVexKey(midi: number, spelling: Spelling = 'sharp'): string {
  const keys = spelling === 'flat' ? KEYS_FLAT : KEYS;
  return `${keys[((midi % 12) + 12) % 12]}/${Math.floor(midi / 12) - 1}`;
}

/**
 * The sign a note needs in front of it, given the key signature: none when
 * the key signature already says it (F♯ in G major), ♯/♭ for other black
 * keys, ♮ for a white key whose letter the key signature changes (F in G major).
 */
export function accidentalFor(
  midi: number,
  spelling: Spelling,
  key: KeySignature = 'C',
): '#' | 'b' | 'n' | null {
  const pc = ((midi % 12) + 12) % 12;
  const altered = KEY_SIGNATURE_ALTERS[key];
  if (BLACK.includes(pc)) return altered.includes(pc) ? null : spelling === 'flat' ? 'b' : '#';
  // the white key with the same letter: F for F♯ (one below), B for B♭ (one above)
  const sameLetter = altered.map((a) => (spellingOf(key) === 'flat' ? a + 1 : a - 1));
  return sameLetter.includes(pc) ? 'n' : null;
}
