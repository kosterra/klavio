import { frequencyToMidiFloat } from '@klavio/shared';
import type { AnalysisFrame } from './pitch/types';

function percentile(values: number[], p: number): number {
  const s = [...values].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.max(0, Math.floor(p * (s.length - 1))))]!;
}

/**
 * Room noise from a few seconds of "silence": 75th percentile of the hop levels,
 * so occasional clicks don't raise it but a steady fan or hum is included.
 */
export function estimateNoiseFloor(levelsDb: number[]): number | null {
  if (levelsDb.length < 20) return null;
  return Math.round(percentile(levelsDb, 0.75) * 10) / 10;
}

/** The note the learner plays for calibration: A4 (the A above middle C). */
export const CALIBRATION_MIDI = 69;

/**
 * Collects the deviation of a sustained A4 from 440 Hz. The first ~300 ms after
 * an attack are skipped: the hammer noise and fast initial decay bias the
 * pitch by a few cents (see the detector tests).
 */
export class A4Calibrator {
  private readonly deviations: number[] = [];
  private sinceAttackMs = 0;
  private lastTime: number | null = null;

  constructor(private readonly gateDb: number) {}

  push(frame: AnalysisFrame): void {
    const dt = this.lastTime === null ? 0 : (frame.time - this.lastTime) * 1000;
    this.lastTime = frame.time;
    if (frame.onsetDb >= 6) this.sinceAttackMs = 0;
    else this.sinceAttackMs += dt;

    const c = frame.candidates[0];
    if (!c || c.clarity < 0.9 || frame.levelDb < this.gateDb) return;
    const deviation = (frequencyToMidiFloat(c.frequency, 440) - CALIBRATION_MIDI) * 100;
    // Within a semitone: a strongly detuned piano is fine, another key is not.
    if (Math.abs(deviation) > 100 || this.sinceAttackMs < 300) return;
    this.deviations.push(deviation);
  }

  /** Share of the required amount of stable sound collected (0–1). */
  get progress(): number {
    return Math.min(1, this.deviations.length / 60);
  }

  /** Concert pitch (Hz) once enough stable frames were collected, else null. */
  result(): { a4Hz: number; deviationCents: number } | null {
    if (this.deviations.length < 60) return null;
    const cents = percentile(this.deviations, 0.5);
    const a4Hz = Math.min(466, Math.max(415, 440 * 2 ** (cents / 1200)));
    return { a4Hz: Math.round(a4Hz * 10) / 10, deviationCents: Math.round(cents) };
  }
}
