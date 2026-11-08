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

interface Partial {
  ratio: number;
  gain: number;
  /** seconds; Infinity = sounds until the key is released (organ) */
  decay: number;
}

/** The sounds of free play – all made from a few sine partials, no samples. */
export const TIMBRES = {
  piano: [
    { ratio: 1, gain: 1, decay: 1.6 },
    { ratio: 2, gain: 0.45, decay: 1.0 },
    { ratio: 3, gain: 0.2, decay: 0.6 },
    { ratio: 4, gain: 0.1, decay: 0.4 },
  ],
  // bell-like: inharmonic partials that fade fast
  musicbox: [
    { ratio: 2, gain: 0.9, decay: 1.2 },
    { ratio: 5.4, gain: 0.35, decay: 0.35 },
    { ratio: 8.9, gain: 0.15, decay: 0.2 },
  ],
  organ: [
    { ratio: 1, gain: 0.8, decay: Infinity },
    { ratio: 2, gain: 0.5, decay: Infinity },
    { ratio: 4, gain: 0.25, decay: Infinity },
  ],
  marimba: [
    { ratio: 1, gain: 1, decay: 0.5 },
    { ratio: 4, gain: 0.3, decay: 0.12 },
    { ratio: 10, gain: 0.08, decay: 0.05 },
  ],
} satisfies Record<string, Partial[]>;
export type Timbre = keyof typeof TIMBRES;

/**
 * Plays a tone for the on-screen keyboard (a few partials; soft piano by
 * default). Returns a handle to release the key.
 */
export function playNote(midi: number, velocity = 0.8, timbre: Timbre = 'piano'): Voice | null {
  const partials: Partial[] = TIMBRES[timbre];
  const held = partials.some((p) => p.decay === Infinity);
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
  // higher notes ring shorter, like a real piano; an organ sounds while held
  const sustain = held ? 30 : Math.max(0.6, 3 - (midi - 48) / 20);
  if (!held) voice.gain.setTargetAtTime(0.0001, now + 0.01, sustain / 3);

  const oscs = partials
    .filter((p) => f0 * p.ratio < 9000)
    .map((p) => {
      const osc = ac.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f0 * p.ratio;
      const g = ac.createGain();
      g.gain.setValueAtTime(p.gain, now);
      if (p.decay !== Infinity) g.gain.setTargetAtTime(0.0001, now, p.decay / 3);
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

export interface Playback {
  stop(): void;
  /** Resolves when the melody has finished (or was stopped). */
  done: Promise<void>;
}

/**
 * Plays a melody ({ midi, beats }) at `tempo` quarter notes per minute.
 * `onNote(index)` is called as each note starts (for highlighting).
 */
export function playMelody(
  notes: { midi: number; beats: number }[],
  tempo: number,
  onNote?: (index: number) => void,
): Playback {
  const beatMs = 60000 / tempo;
  const timers: ReturnType<typeof setTimeout>[] = [];
  const voices: (Voice | null)[] = [];
  let resolve!: () => void;
  const done = new Promise<void>((r) => (resolve = r));
  let t = 0;
  notes.forEach((n, i) => {
    const start = t;
    const length = n.beats * beatMs;
    timers.push(
      setTimeout(() => {
        onNote?.(i);
        // a negative pitch is a rest: keep the time, play nothing
        voices[i] = n.midi >= 0 ? playNote(n.midi, 0.7) : null;
      }, start),
      setTimeout(() => voices[i]?.release(), start + length * 0.9),
    );
    t += length;
  });
  timers.push(setTimeout(resolve, t + 200));
  return {
    done,
    stop() {
      timers.forEach(clearTimeout);
      voices.forEach((v) => v?.release());
      resolve();
    },
  };
}
