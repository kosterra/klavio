// @vitest-environment node
/**
 * Accuracy on real piano recordings (University of Iowa MIS, C2–C6, pp/mf/ff).
 * Fetch them once with `npm run samples:fetch`; without the cache this suite is skipped.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { midiToName } from '@klavio/shared';
import { runPipeline } from './testing/run';
import { gateFromNoiseFloor } from './tracker';

const DIR = join(import.meta.dirname, '../../../../.cache/piano-samples');
const available = existsSync(DIR) && readdirSync(DIR).some((f) => f.endsWith('.wav'));

function readWav(path: string): { rate: number; samples: Float32Array } {
  const buf = readFileSync(path);
  const rate = buf.readUInt32LE(24);
  const n = buf.readUInt32LE(40) / 2;
  const samples = new Float32Array(n);
  for (let i = 0; i < n; i++) samples[i] = buf.readInt16LE(44 + i * 2) / 32768;
  return { rate, samples };
}

interface Result {
  file: string;
  dynamic: string;
  midi: number;
  correct: boolean;
  latencyMs: number;
  extra: string[];
}

describe.skipIf(!available)('real piano samples C2–C6', () => {
  const results: Result[] = [];
  if (available) {
    for (const file of readdirSync(DIR)
      .filter((f) => f.endsWith('.wav'))
      .sort()) {
      const meta = JSON.parse(readFileSync(join(DIR, file.replace(/\.wav$/, '.json')), 'utf8'));
      const { rate, samples } = readWav(join(DIR, file));
      // Like the setup wizard: measure the room noise first (the quiet lead-in);
      // recordings without enough lead-in use the uncalibrated default gate.
      const quiet = samples.subarray(0, Math.floor(rate * meta.quietUntilSec));
      const noiseFloorDb =
        quiet.length > rate * 0.05
          ? 10 * Math.log10(quiet.reduce((s, v) => s + v * v, 0) / quiet.length || 1e-12)
          : null;
      const ons = runPipeline(samples, rate, {
        gateDb: gateFromNoiseFloor(noiseFloorDb),
      }).events.filter((e) => e.type === 'note-on');
      const onsetMs = meta.onsetSec * 1000;
      const first = ons[0];
      // anything else reported within the first 1.5 s of the note counts as a wrong note
      const extra = ons
        .slice(1)
        .filter((e) => e.time < onsetMs + 1500)
        .map((e) => `${midiToName(e.midi)}@${Math.round(e.time - onsetMs)}ms`);
      results.push({
        file,
        dynamic: meta.dynamic,
        midi: meta.midi,
        correct: !!first && first.midi === meta.midi,
        latencyMs: first ? first.time - onsetMs : Infinity,
        extra: first
          ? first.midi === meta.midi
            ? extra
            : [`first=${midiToName(first.midi)}`, ...extra]
          : ['nothing'],
      });
    }
  }

  const ok = (r: Result) => r.correct && r.extra.length === 0 && r.latencyMs <= 100;

  it('prints a report', () => {
    const lines = ['dyn  correct  clean  ≤100ms  median ms  p95 ms'];
    for (const dyn of ['pp', 'mf', 'ff', 'all']) {
      const rs = results.filter((r) => dyn === 'all' || r.dynamic === dyn);
      const lat = rs
        .filter((r) => r.correct)
        .map((r) => r.latencyMs)
        .sort((a, b) => a - b);
      const pct = (n: number) => `${((100 * n) / rs.length).toFixed(1)}%`.padStart(6);
      lines.push(
        `${dyn.padEnd(4)} ${pct(rs.filter((r) => r.correct).length)}  ${pct(rs.filter(ok).length)}  ${pct(rs.filter((r) => r.latencyMs <= 100).length)}  ${String(Math.round(lat[Math.floor(lat.length / 2)] ?? NaN)).padStart(9)}  ${String(Math.round(lat[Math.floor(lat.length * 0.95)] ?? NaN)).padStart(6)}`,
      );
    }
    for (const r of results.filter((r) => !ok(r))) {
      lines.push(
        `  ✗ ${r.dynamic} ${midiToName(r.midi)}: ${Math.round(r.latencyMs)}ms ${r.extra.join(' ')}`,
      );
    }
    // Written to a file because the test runner hides console output of passing tests.
    writeFileSync(join(DIR, '..', 'piano-samples-report.txt'), lines.join('\n') + '\n');
    expect(results.length).toBeGreaterThan(0);
  });

  it('detects ≥ 95 % of notes correctly, cleanly and within 100 ms', () => {
    const rate = results.filter(ok).length / results.length;
    expect(rate).toBeGreaterThanOrEqual(0.95);
  });
});
