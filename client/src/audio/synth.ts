import { midiToFrequency } from '@klavio/shared';

let context: AudioContext | null = null;
let master: GainNode | null = null;

function ctx(): AudioContext | null {
  if (typeof AudioContext === 'undefined') return null;
  if (!context) {
    context = new AudioContext({ latencyHint: 'interactive' });
    master = context.createGain();
    master.gain.value = 0.35;
    const lowpass = context.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 4500;
    master.connect(lowpass).connect(context.destination);
  }
  // iOS: a context only starts inside a user gesture; key presses are gestures.
  if (context.state === 'suspended') void context.resume();
  return context;
}

export interface Voice {
  release(): void;
}

const PARTIALS = [
  { ratio: 1, gain: 1, decay: 1.6 },
  { ratio: 2, gain: 0.45, decay: 1.0 },
  { ratio: 3, gain: 0.2, decay: 0.6 },
  { ratio: 4, gain: 0.1, decay: 0.4 },
];

/**
 * Plays a soft, piano-like tone for the on-screen keyboard (a few decaying
 * partials). Returns a handle to release the key.
 */
export function playNote(midi: number, velocity = 0.8): Voice | null {
  const ac = ctx();
  if (!ac || !master) return null;
  const now = ac.currentTime;
  const f0 = midiToFrequency(midi);
  const voice = ac.createGain();
  voice.gain.value = 0;
  voice.connect(master);
  const peak = 0.25 + 0.5 * velocity;
  voice.gain.setValueAtTime(0, now);
  voice.gain.linearRampToValueAtTime(peak, now + 0.005);
  // higher notes ring shorter, like a real piano
  const sustain = Math.max(0.6, 3 - (midi - 48) / 20);
  voice.gain.setTargetAtTime(0.0001, now + 0.01, sustain / 3);

  const oscs = PARTIALS.filter((p) => f0 * p.ratio < 9000).map((p) => {
    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = f0 * p.ratio;
    const g = ac.createGain();
    g.gain.setValueAtTime(p.gain, now);
    g.gain.setTargetAtTime(0.0001, now, p.decay / 3);
    osc.connect(g).connect(voice);
    osc.start(now);
    osc.stop(now + sustain + 1);
    return osc;
  });

  let released = false;
  return {
    release() {
      if (released) return;
      released = true;
      const t = ac.currentTime;
      voice.gain.cancelScheduledValues(t);
      voice.gain.setValueAtTime(voice.gain.value, t);
      voice.gain.setTargetAtTime(0.0001, t, 0.08);
      for (const o of oscs) o.stop(t + 0.5);
    },
  };
}
