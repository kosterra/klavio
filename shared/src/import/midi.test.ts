import { describe, expect, it } from 'vitest';
import { importMusicXml } from './musicxml.ts';
import { MidiImportError, midiToMusicXml } from './midi.ts';

/** A tiny MIDI file: one track per hand, 480 ticks per quarter, 4/4. */
function smf(tracks: [number, number, number][][]): Uint8Array {
  const bytes: number[] = [];
  const u32 = (n: number) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
  const vlq = (n: number) => {
    const out = [n & 0x7f];
    while ((n >>= 7)) out.unshift((n & 0x7f) | 0x80);
    return out;
  };
  bytes.push(...[77, 84, 104, 100], ...u32(6), 0, 1, 0, tracks.length + 1, 1, 224);
  // tempo track: 4/4, ♩ = 100
  const meta = [
    0, 0xff, 0x58, 4, 4, 2, 24, 8, 0, 0xff, 0x51, 3, 0x09, 0x27, 0xc0, 0, 0xff, 0x2f, 0,
  ];
  bytes.push(...[77, 84, 114, 107], ...u32(meta.length), ...meta);
  for (const notes of tracks) {
    const ev: [number, number[]][] = [];
    for (const [pitch, start, len] of notes) {
      ev.push([start, [0x90, pitch, 80]]);
      ev.push([start + len, [0x80, pitch, 0]]);
    }
    ev.sort((a, b) => a[0] - b[0]);
    const data: number[] = [];
    let t = 0;
    for (const [at, e] of ev) {
      data.push(...vlq(at - t), ...e);
      t = at;
    }
    data.push(0, 0xff, 0x2f, 0);
    bytes.push(...[77, 84, 114, 107], ...u32(data.length), ...data);
  }
  return new Uint8Array(bytes);
}

describe('MIDI import', () => {
  it('two tracks become right and left hand, quantised to sixteenths, bars from the time signature', () => {
    const q = 480;
    const rh: [number, number, number][] = [
      [64, 0, q],
      [67, 0, q], // a chord: the top note counts
      [65, q, q / 2],
      [64, (3 * q) / 2, q / 2],
      [62, 2 * q, 2 * q],
      [60, 4 * q, 4 * q],
    ];
    const lh: [number, number, number][] = [
      [48, 0, 4 * q],
      [43, 4 * q, 4 * q],
    ];
    const r = importMusicXml(midiToMusicXml(smf([rh, lh]), { title: 'Test', composer: 'Ich' }));
    expect(r.kind).toBe('piece');
    if (r.kind !== 'piece') return;
    expect(r.exercise.tempo).toBe(100);
    expect(r.exercise.bars[0]!.rh.map((n) => [n.midi, n.value])).toEqual([
      [67, 'q'],
      [65, '8'],
      [64, '8'],
      [62, 'h'],
    ]);
    expect(r.exercise.bars[0]!.lh).toEqual([{ midi: 48, value: 'w' }]);
    expect(r.exercise.bars[1]!.rh).toEqual([{ midi: 60, value: 'w' }]);
  });

  it('sixteenths stay sixteenths; a slightly late note lands on the grid', () => {
    const q = 480;
    const s = q / 4;
    const rh: [number, number, number][] = [
      [60, 0, s],
      [62, s + 10, s], // a little late
      [64, 2 * s, s],
      [65, 3 * s, s],
      [67, q, 3 * q],
    ];
    const r = importMusicXml(midiToMusicXml(smf([rh]), { title: 'Schnell' }));
    expect(r.kind).toBe('song');
    if (r.kind !== 'song') return;
    expect(r.exercise.bars[0]!.map((n) => [n.midi, n.value])).toEqual([
      [60, '16'],
      [62, '16'],
      [64, '16'],
      [65, '16'],
      [67, 'hd'],
    ]);
  });

  it('refuses what is not MIDI', () => {
    expect(() => midiToMusicXml(new Uint8Array([1, 2, 3]), { title: 'x' })).toThrow(
      MidiImportError,
    );
  });
});
