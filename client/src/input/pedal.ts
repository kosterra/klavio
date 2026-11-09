import { useSyncExternalStore } from 'react';

/**
 * The sustain pedal of a digital piano (MIDI controller 64): pressed or not,
 * and when it last changed. Only MIDI can tell – the microphone can't.
 */
let down = false;
let changedAt = 0;
const listeners = new Set<() => void>();

export function setPedal(pressed: boolean, at = performance.now()) {
  if (pressed === down) return;
  down = pressed;
  changedAt = at;
  for (const l of listeners) l();
}

export function pedalState() {
  return { down, changedAt };
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Whether the pedal is pressed right now (re-renders on change). */
export function usePedal(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => down,
    () => false,
  );
}
