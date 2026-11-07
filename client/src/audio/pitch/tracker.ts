import { frequencyToMidiFloat, type NoteEvent } from '@klavio/shared';
import type { AnalysisFrame } from './types';

export interface TrackerOptions {
  /** Concert pitch from the profile calibration. */
  a4Hz?: number;
  /** Max deviation from the equal-tempered note that still counts (cents). */
  toleranceCents?: number;
  /** Minimum NSDF clarity for a new note. */
  minClarity?: number;
  /** Lower clarity that is enough to keep an already sounding note alive. */
  sustainClarity?: number;
  /** Frames quieter than this (dBFS) are treated as silence. */
  gateDb?: number;
  /** Hysteresis: a sounding note is only released this many dB below the gate. */
  releaseHysteresisDb?: number;
  /** Within this time after a note ends, the same note needs a real attack to start again (ms). */
  retriggerGuardMs?: number;
  /** Consecutive frames with the same note before a note-on (≈ 11 ms each). */
  stableFrames?: number;
  /** Silent frames before a note-off. */
  releaseFrames?: number;
  /** Rise of the high-frequency level (dB) that counts as a new attack. */
  onsetDb?: number;
  /** Overall level rise (dB) needed before the same key counts as struck again. */
  restrikeRiseDb?: number;
  /** Lowest / highest MIDI note reported. */
  minMidi?: number;
  maxMidi?: number;
  /** Converts the frame's audio time (s) into the event time (ms). */
  toEventTime?: (audioTimeSec: number) => number;
}

/** Intervals (semitones) at which piano partials commonly fool pitch detection. */
const HARMONIC_STEPS = [12, 19, 24];

/**
 * Gate a little above the measured room noise (−60 dBFS without calibration).
 * The margin can be small because noise rarely produces a clear, stable pitch.
 */
export function gateFromNoiseFloor(noiseFloorDb: number | null | undefined): number {
  return noiseFloorDb == null ? -60 : Math.min(-30, Math.max(-75, noiseFloorDb + 8));
}

/**
 * Turns per-hop analysis frames into note-on / note-off events.
 * Monophonic for now: at most one note sounds at a time.
 */
export class NoteTracker {
  private readonly o: Required<TrackerOptions>;
  private current: number | null = null;
  private candidate: number | null = null;
  private candidateCount = 0;
  private silentCount = 0;
  private unclearCount = 0;
  private pendingOnset = false;
  private peakDb = -120;
  /** Levels of the last few frames, and the loudest of them before the latest attack. */
  private readonly recentLevels: number[] = [];
  private onsetBaseDb = -120;
  private lastReleased: { midi: number; time: number } | null = null;

  constructor(options: TrackerOptions = {}) {
    this.o = {
      a4Hz: 440,
      toleranceCents: 35,
      minClarity: 0.8,
      sustainClarity: 0.6,
      gateDb: -60,
      releaseHysteresisDb: 6,
      retriggerGuardMs: 1000,
      stableFrames: 2,
      releaseFrames: 4,
      onsetDb: 6,
      restrikeRiseDb: 2,
      minMidi: 33, // A1
      maxMidi: 96, // C7
      toEventTime: (t) => t * 1000,
      ...options,
    };
  }

  /** Currently sounding note (MIDI) or null. */
  get note(): number | null {
    return this.current;
  }

  update(options: Partial<TrackerOptions>): void {
    Object.assign(this.o, options);
  }

  reset(): void {
    this.current = null;
    this.candidate = null;
    this.candidateCount = 0;
    this.silentCount = 0;
    this.unclearCount = 0;
    this.pendingOnset = false;
    this.lastReleased = null;
  }

  process(frame: AnalysisFrame): NoteEvent[] {
    const o = this.o;
    const events: NoteEvent[] = [];
    const time = o.toEventTime(frame.time);

    // Loudest level of the last ~55 ms: a dropout dips and comes back to it,
    // a real strike of the same key goes above it.
    const recentMaxDb = this.recentLevels.length ? Math.max(...this.recentLevels) : -120;
    this.recentLevels.push(frame.levelDb);
    if (this.recentLevels.length > 5) this.recentLevels.shift();
    const gate = this.current !== null ? o.gateDb - o.releaseHysteresisDb : o.gateDb;
    if (frame.levelDb < gate) {
      this.candidate = null;
      this.candidateCount = 0;
      this.pendingOnset = false;
      if (this.current !== null && ++this.silentCount >= o.releaseFrames) {
        events.push(this.off(time));
      }
      return events;
    }
    this.silentCount = 0;

    if (frame.onsetDb >= o.onsetDb) {
      // New attack: require fresh stability before reporting (also for the same key).
      this.pendingOnset = true;
      this.candidate = null;
      this.candidateCount = 0;
      this.peakDb = frame.levelDb;
      this.onsetBaseDb = recentMaxDb;
    } else {
      this.peakDb = Math.max(this.peakDb, frame.levelDb);
    }

    const pitch = frame.candidates[0];
    let midi: number | null = null;
    let cents = 0;
    if (pitch && pitch.clarity >= Math.min(o.minClarity, o.sustainClarity)) {
      const exact = frequencyToMidiFloat(pitch.frequency, o.a4Hz);
      const rounded = Math.round(exact);
      cents = (exact - rounded) * 100;
      const clearEnough =
        pitch.clarity >= o.minClarity || (rounded === this.current && !this.pendingOnset);
      if (
        clearEnough &&
        Math.abs(cents) <= o.toleranceCents &&
        rounded >= o.minMidi &&
        rounded <= o.maxMidi
      ) {
        midi = rounded;
      }
    }

    if (midi === null) {
      this.candidate = null;
      this.candidateCount = 0;
      // A long unclear stretch (noise, speech) ends the note.
      if (this.current !== null && ++this.unclearCount >= o.releaseFrames * 3) {
        events.push(this.off(time));
      }
      return events;
    }
    this.unclearCount = 0;

    if (midi === this.candidate) this.candidateCount++;
    else {
      this.candidate = midi;
      this.candidateCount = 1;
    }

    const isNew = midi !== this.current;
    if (!isNew && !this.pendingOnset) return events;
    // Same key again: a real hammer strike makes the note louder than it was.
    // A click or a short dropout of the audio stream does not.
    if (!isNew && this.peakDb < this.onsetBaseDb + o.restrikeRiseDb) {
      if (this.candidateCount >= o.stableFrames) this.pendingOnset = false;
      return events;
    }
    // The note we just released, coming back without a new attack, is the same
    // string still ringing (level swell), not a new key press.
    if (
      !this.pendingOnset &&
      this.lastReleased?.midi === midi &&
      time - this.lastReleased.time < o.retriggerGuardMs
    ) {
      return events;
    }

    // Without a new attack, a jump to an octave / twelfth of the sounding note
    // (or of the note that just ended) is a detection slip while the string
    // decays — every real key press has a hammer attack.
    const related =
      this.current ??
      (this.lastReleased && time - this.lastReleased.time < o.retriggerGuardMs
        ? this.lastReleased.midi
        : null);
    if (
      !this.pendingOnset &&
      related !== null &&
      HARMONIC_STEPS.includes(Math.abs(midi - related))
    ) {
      return events;
    }
    if (this.candidateCount < o.stableFrames) return events;

    if (this.current !== null) events.push(this.off(time));
    this.current = midi;
    this.pendingOnset = false;
    events.push({
      type: 'note-on',
      midi,
      velocity: Math.min(1, Math.max(0.05, (this.peakDb + 60) / 54)),
      time,
      source: 'microphone',
      cents: Math.round(cents),
    });
    return events;
  }

  private off(time: number): NoteEvent {
    const midi = this.current!;
    this.current = null;
    this.lastReleased = { midi, time };
    this.silentCount = 0;
    this.unclearCount = 0;
    return { type: 'note-off', midi, velocity: 0, time, source: 'microphone' };
  }
}
