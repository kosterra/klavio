import type { NoteEvent } from '@klavio/shared';

/**
 * Decides which played notes reach the exercises.
 *
 * - MIDI has priority: while a MIDI device is connected, microphone notes are
 *   dropped — the microphone would also hear the digital piano itself.
 * - The on-screen keyboard is always accepted. It plays a sound, so microphone
 *   notes shortly after a screen key press are dropped (echo guard).
 */
export class InputHub {
  midiConnected = false;
  private lastScreenKeyAt = -Infinity;
  private micMutedUntil = -Infinity;

  /** Ignore the microphone while the app itself plays music (e.g. "listen first"). */
  muteMicrophoneUntil(time: number): void {
    this.micMutedUntil = time;
  }

  constructor(private readonly echoGuardMs = 600) {}

  accept(event: NoteEvent): boolean {
    switch (event.source) {
      case 'keyboard':
        if (event.type === 'note-on') this.lastScreenKeyAt = event.time;
        return true;
      case 'midi':
        return true;
      case 'microphone':
        if (this.midiConnected || event.time < this.micMutedUntil) return false;
        return event.time - this.lastScreenKeyAt > this.echoGuardMs;
    }
  }
}
