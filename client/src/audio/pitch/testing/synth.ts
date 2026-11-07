import { midiToFrequency } from '@klavio/shared';

/** Deterministic PRNG so synthetic tests never flake. */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

export interface ToneOptions {
  sampleRate?: number;
  /** Seconds of silence (with background noise) before the attack. */
  lead?: number;
  duration?: number;
  cents?: number;
  /** Peak level of the tone (linear). */
  amplitude?: number;
  /** Background noise level (linear RMS). */
  noise?: number;
  seed?: number;
  a4Hz?: number;
}

/**
 * Rough piano model: inharmonic partials (stiff strings), weak fundamental in
 * the bass, faster decay of upper partials, a short noisy hammer attack.
 */
export function pianoTone(midi: number, opts: ToneOptions = {}): Float32Array {
  const {
    sampleRate = 48000,
    lead = 0.2,
    duration = 1.2,
    cents = 0,
    amplitude = 0.3,
    noise = 0.001,
    seed = midi,
    a4Hz = 440,
  } = opts;
  const rand = rng(seed);
  const f0 = midiToFrequency(midi, a4Hz) * 2 ** (cents / 1200);
  const B = midi < 48 ? 3e-4 : 1e-4; // inharmonicity
  const out = new Float32Array(Math.round((lead + duration) * sampleRate));
  const partials: { f: number; a: number; d: number; p: number }[] = [];
  for (let n = 1; n <= 16; n++) {
    const f = n * f0 * Math.sqrt(1 + B * n * n);
    if (f > sampleRate / 2.2) break;
    let a = 1 / n ** 0.9;
    if (n === 1 && midi < 45) a *= 0.35; // weak fundamental in the bass
    partials.push({ f, a, d: 0.6 + 0.35 * n + f / 2000, p: rand() * 2 * Math.PI });
  }
  const start = Math.round(lead * sampleRate);
  for (let i = 0; i < out.length; i++) {
    let v = (rand() * 2 - 1) * noise * 1.7;
    if (i >= start) {
      const t = (i - start) / sampleRate;
      const attack = Math.min(1, t / 0.003);
      let s = 0;
      for (const q of partials)
        s += q.a * Math.exp(-q.d * t) * Math.sin(2 * Math.PI * q.f * t + q.p);
      v += amplitude * attack * s * 0.5;
      if (t < 0.008) v += amplitude * 0.3 * (rand() * 2 - 1) * (1 - t / 0.008); // hammer noise
    }
    out[i] = v;
  }
  return out;
}

export function concat(...parts: Float32Array[]): Float32Array {
  const out = new Float32Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}
