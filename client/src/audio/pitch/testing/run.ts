import type { NoteEvent } from '@klavio/shared';
import { StreamAnalyzer } from '../analyzer';
import { NoteTracker, type TrackerOptions } from '../tracker';
import type { AnalysisFrame } from '../types';

/** Runs a recorded/synthetic signal through the same pipeline as the AudioWorklet. */
export function runPipeline(
  samples: Float32Array,
  sampleRate: number,
  trackerOptions: TrackerOptions = {},
): { events: NoteEvent[]; frames: AnalysisFrame[] } {
  const analyzer = new StreamAnalyzer({ sampleRate });
  const tracker = new NoteTracker(trackerOptions);
  const events: NoteEvent[] = [];
  const frames: AnalysisFrame[] = [];
  // the worklet delivers 128-sample render quanta
  for (let i = 0; i < samples.length; i += 128) {
    analyzer.push(samples.subarray(i, i + 128), (f) => {
      frames.push(f);
      events.push(...tracker.process(f));
    });
  }
  return { events, frames };
}
