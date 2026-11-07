import type * as VF from 'vexflow';

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

/** 61 → "c#/4" (VexFlow key notation, sharps for black keys). */
export function midiToVexKey(midi: number): string {
  return `${KEYS[((midi % 12) + 12) % 12]}/${Math.floor(midi / 12) - 1}`;
}
