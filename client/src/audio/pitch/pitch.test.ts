// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { midiToFrequency, midiToName } from '@klavio/shared';
import { FFT } from './fft';
import { McLeodDetector } from './mpm';
import { concat, pianoTone, rng } from './testing/synth';
import { runPipeline } from './testing/run';

const SR = 48000;

describe('FFT', () => {
  it('round-trips a signal', () => {
    const fft = new FFT(64);
    const r = rng(1);
    const re = Float64Array.from({ length: 64 }, () => r());
    const orig = re.slice();
    const im = new Float64Array(64);
    fft.transform(re, im);
    fft.transform(re, im, true);
    for (let i = 0; i < 64; i++) expect(re[i]! / 64).toBeCloseTo(orig[i]!, 10);
  });
});

describe('McLeod detector', () => {
  it('finds pure sine frequencies within 2 cents', () => {
    const det = new McLeodDetector({ sampleRate: SR, windowSize: 2048 });
    for (const f of [65.41, 110, 261.63, 440, 1046.5, 2000]) {
      const frame = Float32Array.from({ length: 2048 }, (_, i) =>
        Math.sin((2 * Math.PI * f * i) / SR),
      );
      const [c] = det.detect(frame);
      expect(c, `${f} Hz`).toBeDefined();
      expect(Math.abs(1200 * Math.log2(c!.frequency / f))).toBeLessThan(2);
      expect(c!.clarity).toBeGreaterThan(0.95);
    }
  });

  it('reports nothing for silence and low clarity for noise', () => {
    const det = new McLeodDetector({ sampleRate: SR, windowSize: 2048 });
    expect(det.detect(new Float32Array(2048))).toEqual([]);
    const r = rng(7);
    const noise = Float32Array.from({ length: 2048 }, () => r() * 2 - 1);
    const [c] = det.detect(noise);
    expect(c?.clarity ?? 0).toBeLessThan(0.8);
  });
});

describe('pipeline on synthetic piano tones C2–C6', () => {
  const results = [] as { midi: number; ok: boolean; latencyMs: number; detail: string }[];
  for (let midi = 36; midi <= 84; midi++) {
    const cents = ((midi * 7) % 41) - 20; // −20…+20 cents detuning
    const tone = pianoTone(midi, { cents, sampleRate: SR, lead: 0.2, duration: 1.2 });
    const { events } = runPipeline(tone, SR);
    const ons = events.filter((e) => e.type === 'note-on');
    const first = ons[0];
    const latencyMs = first ? first.time - 200 : Infinity;
    results.push({
      midi,
      ok: !!first && first.midi === midi && ons.length === 1,
      latencyMs,
      detail: ons.map((e) => `${midiToName(e.midi)}@${Math.round(e.time)}`).join(' '),
    });
  }

  it('detects every note exactly once', () => {
    const failed = results.filter((r) => !r.ok).map((r) => `${midiToName(r.midi)}: ${r.detail}`);
    expect(failed).toEqual([]);
  });

  it('reports notes within 100 ms of the attack', () => {
    const slow = results
      .filter((r) => r.latencyMs > 100)
      .map((r) => `${midiToName(r.midi)}: ${Math.round(r.latencyMs)} ms`);
    expect(slow).toEqual([]);
  });
});

describe('note tracker', () => {
  it('stays silent on background noise', () => {
    const r = rng(3);
    const noise = Float32Array.from({ length: SR }, () => (r() * 2 - 1) * 0.002);
    expect(runPipeline(noise, SR).events).toEqual([]);
  });

  it('reports a melody, including the same key struck twice', () => {
    const notes = [60, 62, 64, 64, 65, 67];
    const signal = concat(
      ...notes.map((m, i) => pianoTone(m, { lead: i === 0 ? 0.2 : 0, duration: 0.35, seed: i })),
    );
    const ons = runPipeline(signal, SR).events.filter((e) => e.type === 'note-on');
    expect(ons.map((e) => e.midi)).toEqual(notes);
  });

  it('applies the A4 calibration', () => {
    // A piano tuned to A4 = 452 Hz is ~47 cents sharp: without calibration its
    // notes fall between two keys and are rejected; with it they are recognised.
    const tone = pianoTone(69, { a4Hz: 452 });
    expect(runPipeline(tone, SR).events).toEqual([]);
    const on = runPipeline(tone, SR, { a4Hz: 452 }).events.find((e) => e.type === 'note-on');
    expect(on?.midi).toBe(69);
  });

  it('ignores notes that are too far out of tune', () => {
    const tone = pianoTone(60, { cents: 48 });
    const ons = runPipeline(tone, SR, { toleranceCents: 35 }).events;
    expect(ons).toEqual([]);
  });

  it('releases the note when the sound stops', () => {
    const signal = concat(pianoTone(67, { duration: 0.3 }), new Float32Array(SR / 4));
    const types = runPipeline(signal, SR).events.map((e) => e.type);
    expect(types).toEqual(['note-on', 'note-off']);
  });

  it('works at 44.1 kHz too', () => {
    const tone = pianoTone(57, { sampleRate: 44100 });
    const on = runPipeline(tone, 44100).events.find((e) => e.type === 'note-on');
    expect(on?.midi).toBe(57);
    expect(midiToFrequency(57)).toBe(220);
  });
});
