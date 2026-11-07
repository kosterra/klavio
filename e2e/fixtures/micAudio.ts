import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const RATE = 48000;

/** Simple piano-like tone: decaying harmonics plus a short attack. */
function tone(midi: number, seconds: number, amp = 0.25): Float32Array {
  const f0 = 440 * 2 ** ((midi - 69) / 12);
  const out = new Float32Array(Math.round(seconds * RATE));
  for (let i = 0; i < out.length; i++) {
    const t = i / RATE;
    let v = 0;
    for (let n = 1; n <= 8; n++) {
      v += (Math.sin(2 * Math.PI * n * f0 * t) / n) * Math.exp(-t * (0.8 + 0.4 * n));
    }
    out[i] = amp * Math.min(1, t / 0.003) * v * 0.6;
  }
  return out;
}

function silence(seconds: number): Float32Array {
  const out = new Float32Array(Math.round(seconds * RATE));
  let s = 1;
  for (let i = 0; i < out.length; i++) {
    s = (s * 1664525 + 1013904223) >>> 0;
    out[i] = ((s / 2 ** 32) * 2 - 1) * 0.0005; // faint room noise
  }
  return out;
}

/**
 * Fake microphone input for Chromium (`--use-file-for-fake-audio-capture`):
 * 4 s quiet room → held A4 (tuning) → C4 E4 G4 C5 → quiet.
 */
export function writeMicFixture(path: string) {
  const parts = [
    silence(4),
    tone(69, 3.5),
    silence(0.3),
    ...[60, 64, 67, 72].flatMap((m) => [tone(m, 0.8), silence(0.25)]),
    silence(20),
  ];
  const total = parts.reduce((n, p) => n + p.length, 0);
  const buf = Buffer.alloc(44 + total * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + total * 2, 4);
  buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(RATE, 24);
  buf.writeUInt32LE(RATE * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(total * 2, 40);
  let o = 44;
  for (const p of parts) {
    for (const v of p) {
      buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(v * 32767))), o);
      o += 2;
    }
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, buf);
}
