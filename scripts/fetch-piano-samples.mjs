#!/usr/bin/env node
/**
 * Downloads single piano notes C2–C6 from the University of Iowa Musical
 * Instrument Samples (free to use without restriction) and stores trimmed mono
 * 16-bit WAV files in .cache/piano-samples for the pitch-detection accuracy test.
 *
 *   node scripts/fetch-piano-samples.mjs [pp,mf,ff] [--force]
 *
 * Only the first ~1.5 MB of each AIFF is fetched (HTTP range request).
 */
import { access, mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const BASE = 'https://theremin.music.uiowa.edu/sound%20files/MIS/Piano_Other/piano/';
const OUT = join(import.meta.dirname, '..', '.cache', 'piano-samples');
const NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const dynamics = (process.argv.slice(2).find((a) => !a.startsWith('--')) ?? 'pp,mf,ff').split(',');
const LEAD_S = 0.3;
const KEEP_S = 2.0;

function readExtended80(buf, off) {
  // 80-bit IEEE 754 extended precision (AIFF sample rate)
  const exp = buf.readUInt16BE(off) & 0x7fff;
  const hi = buf.readUInt32BE(off + 2);
  const lo = buf.readUInt32BE(off + 6);
  return (hi * 2 ** 32 + lo) * 2 ** (exp - 16383 - 63);
}

function parseAiff(buf) {
  if (buf.toString('ascii', 0, 4) !== 'FORM') throw new Error('not an AIFF file');
  let off = 12;
  let channels, bits, rate, data;
  while (off + 8 <= buf.length) {
    const id = buf.toString('ascii', off, off + 4);
    const size = buf.readUInt32BE(off + 4);
    const body = off + 8;
    if (id === 'COMM') {
      channels = buf.readUInt16BE(body);
      bits = buf.readUInt16BE(body + 6);
      rate = readExtended80(buf, body + 8);
    } else if (id === 'SSND') {
      const dataOffset = buf.readUInt32BE(body);
      data = buf.subarray(body + 8 + dataOffset, Math.min(buf.length, body + size)); // may be truncated
      break;
    }
    off = body + size + (size % 2);
  }
  if (bits !== 16 || !data) throw new Error('expected 16-bit PCM');
  const frames = Math.floor(data.length / (2 * channels));
  const mono = new Float32Array(frames);
  for (let i = 0; i < frames; i++) {
    let s = 0;
    for (let c = 0; c < channels; c++) s += data.readInt16BE((i * channels + c) * 2);
    mono[i] = s / channels / 32768;
  }
  return { rate, mono };
}

function wav16(samples, rate) {
  const buf = Buffer.alloc(44 + samples.length * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + samples.length * 2, 4);
  buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(rate, 24);
  buf.writeUInt32LE(rate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) {
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(samples[i] * 32767))), 44 + i * 2);
  }
  return buf;
}

/**
 * Attack = walk back from the loudest point of a 2 ms RMS envelope to where it
 * falls below 30 % of that peak. Robust against clicks, key noise and handling noise in the
 * lead-in, which a simple "first sample above x % of the peak" would pick up.
 */
function findOnset(x, rate, fraction = 0.3) {
  const win = Math.max(1, Math.round(rate * 0.002));
  const env = [];
  for (let i = 0; i + win <= x.length; i += win) {
    let e = 0;
    for (let k = i; k < i + win; k++) e += x[k] * x[k];
    env.push(Math.sqrt(e / win));
  }
  let peakIdx = 0;
  for (let i = 1; i < env.length; i++) if (env[i] > env[peakIdx]) peakIdx = i;
  let i = peakIdx;
  while (i > 0 && env[i - 1] > env[peakIdx] * fraction) i--;
  return i * win;
}

if (process.argv.includes('--force')) await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
let fetched = 0;
for (const dyn of dynamics) {
  for (let midi = 36; midi <= 84; midi++) {
    const name = `${NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
    const target = join(OUT, `${dyn}.${midi}.wav`);
    try {
      await access(target);
      continue;
    } catch {
      /* not cached yet */
    }
    const res = await fetch(`${BASE}Piano.${dyn}.${name}.aiff`, {
      headers: { Range: 'bytes=0-1499999' },
    });
    if (!res.ok) {
      console.warn(`skip ${dyn} ${name}: HTTP ${res.status}`);
      continue;
    }
    const { rate, mono } = parseAiff(Buffer.from(await res.arrayBuffer()));
    const onset = findOnset(mono, rate);
    // first sign of activity (key noise etc.) — everything before it is room noise
    const activity = findOnset(mono, rate, 0.05);
    const start = Math.max(0, onset - Math.round(LEAD_S * rate));
    const clip = mono.subarray(start, Math.min(mono.length, onset + Math.round(KEEP_S * rate)));
    await writeFile(target, wav16(clip, Math.round(rate)));
    await writeFile(
      target.replace(/\.wav$/, '.json'),
      JSON.stringify({
        midi,
        dynamic: dyn,
        name,
        onsetSec: (onset - start) / rate,
        quietUntilSec: Math.max(0, (activity - start) / rate - 0.05),
      }),
    );
    fetched++;
    process.stdout.write(`${dyn} ${name} `);
  }
}
console.log(`\n${fetched} new samples in ${OUT}`);
