import { FFT } from './fft';
import type { PitchCandidate, PitchDetector } from './types';

export interface MpmOptions {
  sampleRate: number;
  windowSize: number;
  /** Lowest / highest frequency to look for (Hz). */
  minFreq?: number;
  maxFreq?: number;
  /** McLeod's "k": pick the first key maximum ≥ k · highest maximum. */
  cutoff?: number;
}

/**
 * Monophonic pitch detection with the McLeod Pitch Method (normalised square
 * difference function, NSDF). The autocorrelation is computed via FFT, so one
 * analysis costs O(N log N) and fits easily into an AudioWorklet render budget.
 *
 * Returns at most one candidate; the array type keeps the door open for a
 * polyphonic detector behind the same interface.
 */
export class McLeodDetector implements PitchDetector {
  readonly sampleRate: number;
  readonly windowSize: number;
  private readonly minLag: number;
  private readonly maxLag: number;
  private readonly cutoff: number;
  private readonly fft: FFT;
  private readonly re: Float64Array;
  private readonly im: Float64Array;
  private readonly nsdf: Float64Array;
  private readonly peaks: number[] = [];

  constructor({ sampleRate, windowSize, minFreq = 55, maxFreq = 2200, cutoff = 0.9 }: MpmOptions) {
    this.sampleRate = sampleRate;
    this.windowSize = windowSize;
    this.cutoff = cutoff;
    this.minLag = Math.max(2, Math.floor(sampleRate / maxFreq));
    // NSDF needs a few periods inside the window to be reliable.
    this.maxLag = Math.min(Math.ceil(sampleRate / minFreq), Math.floor(windowSize * 0.6));
    this.fft = new FFT(nextPow2(windowSize * 2));
    this.re = new Float64Array(this.fft.size);
    this.im = new Float64Array(this.fft.size);
    this.nsdf = new Float64Array(this.maxLag + 2);
  }

  detect(frame: Float32Array): PitchCandidate[] {
    const n = this.windowSize;
    const { re, im, nsdf } = this;
    const offset = frame.length - n; // analyse the newest `windowSize` samples

    // Autocorrelation r(τ) via |FFT|² of the zero-padded window.
    re.fill(0);
    im.fill(0);
    let energy = 0;
    for (let i = 0; i < n; i++) {
      const v = frame[offset + i]!;
      re[i] = v;
      energy += v * v;
    }
    if (energy < 1e-10) return [];
    this.fft.transform(re, im);
    for (let i = 0; i < re.length; i++) {
      re[i] = re[i]! * re[i]! + im[i]! * im[i]!;
      im[i] = 0;
    }
    this.fft.transform(re, im, true);
    const scale = 1 / re.length;

    // m(τ) = Σ x[j]² + x[j+τ]², updated incrementally.
    let m = 2 * energy;
    for (let tau = 0; tau <= this.maxLag + 1; tau++) {
      if (tau > 0) {
        const a = frame[offset + tau - 1]!;
        const b = frame[offset + n - tau]!;
        m -= a * a + b * b;
      }
      nsdf[tau] = m > 1e-12 ? (2 * re[tau]! * scale) / m : 0;
    }

    // Key maxima: the highest point between a positive-going and the next
    // negative-going zero crossing (skipping the lobe around τ = 0).
    const peaks = this.peaks;
    peaks.length = 0;
    let tau = 1;
    while (tau < this.maxLag && nsdf[tau]! > 0) tau++;
    let best = -1;
    let inLobe = false;
    let lobeMax = -1;
    for (; tau <= this.maxLag; tau++) {
      const v = nsdf[tau]!;
      if (v > 0) {
        if (!inLobe) {
          inLobe = true;
          lobeMax = -1;
        }
        if (tau >= this.minLag && (lobeMax < 0 || v > nsdf[lobeMax]!)) lobeMax = tau;
      } else if (inLobe) {
        inLobe = false;
        if (lobeMax > 0) peaks.push(lobeMax);
      }
    }
    if (inLobe && lobeMax > 0 && lobeMax < this.maxLag) peaks.push(lobeMax);
    if (peaks.length === 0) return [];
    for (const p of peaks) if (nsdf[p]! > best) best = nsdf[p]!;

    const threshold = this.cutoff * best;
    const chosen = peaks.find((p) => nsdf[p]! >= threshold)!;

    // Parabolic interpolation around the chosen lag.
    const y0 = nsdf[chosen - 1]!;
    const y1 = nsdf[chosen]!;
    const y2 = nsdf[chosen + 1]!;
    const denom = y0 - 2 * y1 + y2;
    const shift = denom !== 0 ? (0.5 * (y0 - y2)) / denom : 0;
    const period = chosen + Math.max(-0.5, Math.min(0.5, shift));
    const clarity = Math.min(1, y1 - 0.25 * (y0 - y2) * shift);

    return [{ frequency: this.sampleRate / period, clarity }];
  }
}

function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}
