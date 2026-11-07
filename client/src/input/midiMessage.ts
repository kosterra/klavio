/** A note message from a MIDI device, already decoded. */
export interface MidiNote {
  type: 'note-on' | 'note-off';
  midi: number;
  /** 0–1 */
  velocity: number;
  channel: number;
}

/**
 * Decodes raw MIDI bytes. Only note on/off are relevant for exercises;
 * "note on" with velocity 0 is the common running-status way to say note off.
 */
export function parseMidiMessage(data: ArrayLike<number>): MidiNote | null {
  if (data.length < 3) return null;
  const status = data[0]! & 0xf0;
  const channel = data[0]! & 0x0f;
  const midi = data[1]! & 0x7f;
  const velocity = data[2]! & 0x7f;
  if (status === 0x90 && velocity > 0) {
    return { type: 'note-on', midi, velocity: velocity / 127, channel };
  }
  if (status === 0x80 || (status === 0x90 && velocity === 0)) {
    return { type: 'note-off', midi, velocity: 0, channel };
  }
  return null;
}
