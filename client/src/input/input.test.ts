// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { NoteEvent } from '@klavio/shared';
import { parseMidiMessage } from './midiMessage';
import { midiForKeyCode } from './computerKeys';
import { InputHub } from './inputHub';

describe('MIDI messages', () => {
  it('decodes note on / off on any channel', () => {
    expect(parseMidiMessage([0x90, 60, 100])).toEqual({
      type: 'note-on',
      midi: 60,
      velocity: 100 / 127,
      channel: 0,
    });
    expect(parseMidiMessage([0x83, 64, 40])).toMatchObject({
      type: 'note-off',
      midi: 64,
      channel: 3,
    });
    // note on with velocity 0 = note off (running status)
    expect(parseMidiMessage([0x91, 67, 0])).toMatchObject({ type: 'note-off', midi: 67 });
  });

  it('ignores other messages', () => {
    expect(parseMidiMessage([0xb0, 64, 127])).toBeNull(); // sustain pedal
    expect(parseMidiMessage([0xf8])).toBeNull(); // clock
    expect(parseMidiMessage([0xe0, 0, 64])).toBeNull(); // pitch bend
  });
});

describe('computer keyboard', () => {
  it('maps the home row to white keys from the base C', () => {
    expect(
      ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK'].map((c) =>
        midiForKeyCode(c, 60),
      ),
    ).toEqual([60, 62, 64, 65, 67, 69, 71, 72]);
    expect(midiForKeyCode('KeyW', 48)).toBe(49);
    expect(midiForKeyCode('KeyY', 60)).toBe(68); // Z on QWERTZ
    expect(midiForKeyCode('Space', 60)).toBeNull();
  });
});

describe('input hub', () => {
  const ev = (
    source: NoteEvent['source'],
    time: number,
    type: NoteEvent['type'] = 'note-on',
  ): NoteEvent => ({
    type,
    midi: 60,
    velocity: 1,
    time,
    source,
  });

  it('prefers MIDI over the microphone', () => {
    const hub = new InputHub();
    expect(hub.accept(ev('microphone', 1000))).toBe(true);
    hub.midiConnected = true;
    expect(hub.accept(ev('microphone', 2000))).toBe(false);
    expect(hub.accept(ev('midi', 2000))).toBe(true);
  });

  it('drops the microphone echo of the on-screen keyboard', () => {
    const hub = new InputHub(600);
    expect(hub.accept(ev('keyboard', 1000))).toBe(true);
    expect(hub.accept(ev('microphone', 1080))).toBe(false);
    expect(hub.accept(ev('microphone', 1700))).toBe(true);
  });
});
