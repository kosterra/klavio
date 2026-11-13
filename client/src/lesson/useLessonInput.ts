import { useCallback } from 'react';
import { useMidi } from '../input/useMidi';
import { usePitchDetection } from '../audio/usePitchDetection';
import { microphoneSupported } from '../audio/microphone';
import { useSession } from '../auth/session';

export type LessonInputMode = 'midi' | 'microphone' | 'screen';

/**
 * Which input a lesson listens to: MIDI if a device is connected, else the
 * microphone (started from the "start" tap), else the on-screen keyboard.
 */
export function useLessonInput() {
  const { activeProfile } = useSession();
  const midi = useMidi();
  const mic = usePitchDetection({
    a4Hz: activeProfile?.calibration.a4Hz ?? 440,
    noiseFloorDb: activeProfile?.calibration.noiseFloorDb ?? null,
  });
  const midiActive = midi.devices.length > 0;
  // stable: the lesson stops the microphone when it goes away (an effect cleanup) –
  // a new function on every render would stop it at every render
  const { start, stop } = mic;
  const startMicrophone = useCallback(() => void start(), [start]);
  const stopMicrophone = useCallback(() => void stop(), [stop]);
  const mode: LessonInputMode = midiActive
    ? 'midi'
    : mic.status === 'running'
      ? 'microphone'
      : 'screen';

  return {
    mode,
    midiDevice: midi.devices[0]?.name ?? null,
    micStatus: mic.status,
    micError: mic.error,
    micSupported: microphoneSupported(),
    /** Call from a user gesture (iOS starts audio only then). */
    startPreferred: () => {
      if (!midiActive && microphoneSupported() && mic.status === 'idle') startMicrophone();
    },
    startMicrophone,
    stopMicrophone,
  };
}
