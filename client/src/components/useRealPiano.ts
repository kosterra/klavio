import { usePitchDetection } from '../audio/usePitchDetection';
import { microphoneSupported } from '../audio/microphone';
import { useSession } from '../auth/session';
import { useMidi } from '../input/useMidi';

/** The real piano outside the lessons: a digital piano, or the microphone once started. */
export function useRealPiano() {
  const { activeProfile } = useSession();
  const midi = useMidi();
  const mic = usePitchDetection({
    a4Hz: activeProfile?.calibration.a4Hz ?? 440,
    noiseFloorDb: activeProfile?.calibration.noiseFloorDb ?? null,
  });
  const midiDevice = midi.devices[0]?.name ?? null;
  return {
    mic,
    midiDevice,
    /** heard: the screen keys only show the notes, they do not play */
    active: !!midiDevice || mic.status === 'running',
    /** from a tap (iOS starts audio only then): listen, unless a digital piano is there */
    listen: () => {
      if (!midiDevice && microphoneSupported() && mic.status === 'idle') void mic.start();
    },
  };
}

export type RealPiano = ReturnType<typeof useRealPiano>;
