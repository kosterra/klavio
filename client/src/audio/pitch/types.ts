/** One pitch found in an analysis window. */
export interface PitchCandidate {
  frequency: number;
  /** 0–1: how periodic the signal is (NSDF peak height). */
  clarity: number;
}

/**
 * A pitch detector analyses one window of samples. Monophonic detectors return
 * zero or one candidate; a future polyphonic detector returns several.
 */
export interface PitchDetector {
  readonly sampleRate: number;
  readonly windowSize: number;
  detect(frame: Float32Array): PitchCandidate[];
}

/** Result of analysing one hop, sent from the AudioWorklet to the main thread. */
export interface AnalysisFrame {
  /** Time of the newest sample in the window, in seconds of audio time. */
  time: number;
  /** RMS level of the window in dBFS (−∞ for digital silence → clamped to −120). */
  levelDb: number;
  /** Positive jump of the short-term level, used for onset detection (dB). */
  onsetDb: number;
  candidates: PitchCandidate[];
  /** Processing time of this analysis in ms (for the test page). */
  costMs: number;
}
