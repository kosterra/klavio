import { McLeodDetector } from './mpm';
import type { AnalysisFrame, PitchDetector } from './types';

export interface AnalyzerOptions {
  sampleRate: number;
  /** Analysis window; 2048 @ 48 kHz ≈ 43 ms, enough for C2 (65 Hz). */
  windowSize?: number;
  /** Samples between analyses; 512 @ 48 kHz ≈ 10.7 ms. */
  hopSize?: number;
  detector?: PitchDetector;
  /** Clock for cost measurement (AudioWorklet scopes may lack `performance`). */
  now?: () => number;
}

const MIN_DB = -120;

function toDb(meanSquare: number): number {
  return meanSquare > 0 ? Math.max(MIN_DB, 10 * Math.log10(meanSquare)) : MIN_DB;
}

/**
 * Feeds arbitrary-sized sample chunks (the AudioWorklet delivers 128 at a time)
 * into a sliding window and emits one {@link AnalysisFrame} per hop.
 * Pure TypeScript: runs in the worklet, in Node tests and on recorded samples.
 */
export class StreamAnalyzer {
  readonly sampleRate: number;
  readonly windowSize: number;
  readonly hopSize: number;
  private readonly detector: PitchDetector;
  private readonly now: () => number;
  private readonly window: Float32Array;
  private filled = 0;
  private sinceHop = 0;
  private hopEnergy = 0;
  /** Energy of the first difference: emphasises the broadband hammer attack. */
  private hopAttackEnergy = 0;
  private lastSample = 0;
  private samplesSeen = 0;
  private prevAttackDb = MIN_DB;

  constructor({ sampleRate, windowSize, hopSize, detector, now }: AnalyzerOptions) {
    this.sampleRate = sampleRate;
    // Keep ~43 ms windows / ~11 ms hops regardless of the device sample rate.
    this.windowSize = windowSize ?? (sampleRate > 60000 ? 4096 : 2048);
    this.hopSize = hopSize ?? (sampleRate > 60000 ? 1024 : 512);
    this.detector =
      detector ?? new McLeodDetector({ sampleRate, windowSize: this.windowSize, minFreq: 55 });
    this.now = now ?? (() => (typeof performance !== 'undefined' ? performance.now() : Date.now()));
    this.window = new Float32Array(this.windowSize);
  }

  /** Push samples; returns the frames completed by this chunk (usually 0 or 1). */
  push(samples: Float32Array, onFrame: (frame: AnalysisFrame) => void): void {
    const w = this.window;
    const n = this.windowSize;
    let i = 0;
    while (i < samples.length) {
      const take = Math.min(samples.length - i, this.hopSize - this.sinceHop);
      // shift-in: keep the window as "oldest … newest" (cheap at these sizes)
      w.copyWithin(0, take);
      for (let k = 0; k < take; k++) {
        const v = samples[i + k]!;
        w[n - take + k] = v;
        this.hopEnergy += v * v;
        const d = v - this.lastSample;
        this.hopAttackEnergy += d * d;
        this.lastSample = v;
      }
      i += take;
      this.sinceHop += take;
      this.samplesSeen += take;
      this.filled = Math.min(n, this.filled + take);
      if (this.sinceHop === this.hopSize) {
        onFrame(this.analyse());
        this.sinceHop = 0;
        this.hopEnergy = 0;
        this.hopAttackEnergy = 0;
      }
    }
  }

  private analyse(): AnalysisFrame {
    const start = this.now();
    const levelDb = toDb(this.hopEnergy / this.hopSize);
    // Onset: jump of the high-frequency ("attack") level against the previous
    // hop. Upper partials of a ringing note die away quickly, so even a key
    // struck again under the sustain pedal jumps clearly, while the slow swells
    // of beating unison strings rise only a few dB per hop.
    const attackDb = toDb(this.hopAttackEnergy / this.hopSize);
    const onsetDb = Math.max(0, attackDb - this.prevAttackDb);
    this.prevAttackDb = attackDb;

    const candidates = this.filled >= this.windowSize ? this.detector.detect(this.window) : [];
    return {
      time: this.samplesSeen / this.sampleRate,
      levelDb,
      onsetDb,
      candidates,
      costMs: this.now() - start,
    };
  }
}
