import { useEffect, useSyncExternalStore } from 'react';
import { midiService } from './midi';

/** MIDI connection state; reconnects silently if MIDI was allowed before. */
export function useMidi() {
  const state = useSyncExternalStore(midiService.subscribe, midiService.getState);
  useEffect(() => {
    void midiService.connectIfGranted();
  }, []);
  return { ...state, connect: () => midiService.connect() };
}
