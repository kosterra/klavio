import { useEffect, useRef } from 'react';
import type { NoteEvent } from '@klavio/shared';
import { InputHub } from './inputHub';

type Listener = (event: NoteEvent) => void;

function createBus() {
  const listeners = new Set<Listener>();
  return {
    emit(event: NoteEvent) {
      for (const l of listeners) l(event);
    },
    subscribe(listener: Listener): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/** Every note from every input, unfiltered (test pages, calibration). */
export const rawNoteBus = createBus();
/** Notes the exercises should react to, after input priority (MIDI first) and echo guard. */
export const noteBus = createBus();
/** Notes the input priority dropped (for transparency on the input page). */
export const droppedNoteBus = createBus();
export const inputHub = new InputHub();

/**
 * The one entry point for all inputs: microphone, MIDI and the on-screen
 * keyboard publish here; exercises subscribe without knowing the source.
 */
export function publishNote(event: NoteEvent): void {
  rawNoteBus.emit(event);
  if (inputHub.accept(event)) noteBus.emit(event);
  else droppedNoteBus.emit(event);
}

function useBus(bus: ReturnType<typeof createBus>, handler: Listener) {
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  });
  useEffect(() => bus.subscribe((e) => ref.current(e)), [bus]);
}

/** Played notes for exercises (the latest handler is always used). */
export function useNoteEvents(handler: Listener): void {
  useBus(noteBus, handler);
}

/** All notes, including those the input priority drops. */
export function useRawNoteEvents(handler: Listener): void {
  useBus(rawNoteBus, handler);
}

/** Notes dropped by the input priority (MIDI first, echo guard). */
export function useDroppedNoteEvents(handler: Listener): void {
  useBus(droppedNoteBus, handler);
}
