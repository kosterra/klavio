// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { A4Calibrator, estimateNoiseFloor } from './calibration';
import { pianoTone } from './pitch/testing/synth';
import { runPipeline } from './pitch/testing/run';

describe('calibration', () => {
  it('estimates the noise floor robustly against clicks', () => {
    const levels = Array.from({ length: 100 }, (_, i) => (i % 25 === 0 ? -20 : -70 + (i % 3)));
    expect(estimateNoiseFloor(levels)).toBeGreaterThanOrEqual(-70);
    expect(estimateNoiseFloor(levels)).toBeLessThan(-66);
    expect(estimateNoiseFloor([-50])).toBeNull();
  });

  it.each([440, 443, 432, 452])('measures a piano tuned to A4 = %d Hz within 1 Hz', (a4) => {
    const cal = new A4Calibrator(-60);
    const { frames } = runPipeline(pianoTone(69, { a4Hz: a4, duration: 2.5 }), 48000);
    frames.forEach((f) => cal.push(f));
    const r = cal.result();
    expect(r).not.toBeNull();
    expect(Math.abs(r!.a4Hz - a4)).toBeLessThan(1);
  });

  it('needs enough sustained sound', () => {
    const cal = new A4Calibrator(-60);
    runPipeline(pianoTone(69, { duration: 0.4 }), 48000).frames.forEach((f) => cal.push(f));
    expect(cal.result()).toBeNull();
  });
});
