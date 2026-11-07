import { useEffect, useRef } from 'react';
import type { NoteEvent } from '@klavio/shared';

type Listener = (event: NoteEvent) => void;
const listeners = new Set<Listener>();

/**
 * The one place all inputs report played notes to: microphone, MIDI and the
 * on-screen keyboard emit, exercises subscribe — without knowing the source.
 */
export const noteBus = {
  emit(event: NoteEvent) {
    for (const l of listeners) l(event);
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

/** Subscribe a component to played notes; the latest handler is always used. */
export function useNoteEvents(handler: Listener): void {
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  });
  useEffect(() => noteBus.subscribe((e) => ref.current(e)), []);
}
