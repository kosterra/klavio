/**
 * One played note, independent of where it came from. Microphone pitch
 * detection, Web MIDI and the on-screen keyboard all emit this structure, so
 * exercises never need to know the input source.
 */
export interface NoteEvent {
  type: 'note-on' | 'note-off';
  midi: number;
  /** 0–1; the on-screen keyboard uses a fixed value, the microphone the onset strength. */
  velocity: number;
  /** `performance.now()` timestamp in ms. */
  time: number;
  source: 'keyboard' | 'midi' | 'microphone';
  /** Microphone only: deviation from the equal-tempered note, in cents. */
  cents?: number;
}
