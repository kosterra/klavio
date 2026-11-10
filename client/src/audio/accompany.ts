import type { AccompEvent } from '@klavio/shared';
import { playNote, type Voice } from './synth';

export interface Accompaniment {
  stop(): void;
}

/**
 * Plays Klavi's accompaniment: each event at `startMs + at × beatMs`
 * (performance time), held for its length. Soft, so the melody stays in front.
 */
export function playAccompaniment(
  events: AccompEvent[],
  beatMs: number,
  startMs: number,
): Accompaniment {
  const timers: ReturnType<typeof setTimeout>[] = [];
  const voices: Voice[] = [];
  const now = performance.now();
  for (const e of events) {
    const at = startMs + e.at * beatMs - now;
    if (at < -20) continue;
    timers.push(
      setTimeout(
        () => {
          const held = e.midis.flatMap((m) => playNote(m, e.velocity) ?? []);
          voices.push(...held);
          timers.push(setTimeout(() => held.forEach((v) => v.release()), e.beats * beatMs * 0.95));
        },
        Math.max(0, at),
      ),
    );
  }
  return {
    stop() {
      timers.forEach(clearTimeout);
      voices.forEach((v) => v.release());
    },
  };
}

/** A chord struck once (for «wait for me»): rings until the next one. */
export function strikeChord(midis: number[], velocity = 0.3): Accompaniment {
  const voices = midis.flatMap((m) => playNote(m, velocity) ?? []);
  return { stop: () => voices.forEach((v) => v.release()) };
}
