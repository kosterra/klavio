import { useCallback, useEffect, useRef, useState } from 'react';
import { frequencyToMidiFloat } from '@klavio/shared';
import { noteBus } from '../input/noteBus';
import {
  MicError,
  openMicrophone,
  type MicErrorCode,
  type MicInfo,
  type MicSession,
} from './microphone';
import { NoteTracker, gateFromNoiseFloor } from './pitch/tracker';
import type { AnalysisFrame } from './pitch/types';

export interface PitchSettings {
  a4Hz: number;
  noiseFloorDb: number | null;
  toleranceCents?: number;
}

export interface LiveState {
  levelDb: number;
  gateDb: number;
  /** Raw detector output of the latest frame. */
  frequency: number | null;
  clarity: number;
  /** Note currently reported by the tracker (MIDI) and the latest deviation. */
  note: number | null;
  cents: number | null;
  costMs: number;
}

const initialLive: LiveState = {
  levelDb: -120,
  gateDb: -60,
  frequency: null,
  clarity: 0,
  note: null,
  cents: null,
  costMs: 0,
};

/**
 * Microphone → AudioWorklet pitch analysis → note tracker → {@link noteBus}.
 * The UI state is refreshed once per animation frame; note events are emitted
 * immediately as they are detected.
 */
export function usePitchDetection(settings: PitchSettings) {
  const [status, setStatus] = useState<'idle' | 'starting' | 'running' | 'error'>('idle');
  const [error, setError] = useState<MicErrorCode | null>(null);
  const [info, setInfo] = useState<MicInfo | null>(null);
  const [live, setLive] = useState<LiveState>(initialLive);
  const session = useRef<MicSession | null>(null);
  const tracker = useRef<NoteTracker | null>(null);
  const frameListeners = useRef(new Set<(f: AnalysisFrame) => void>());
  const latest = useRef<LiveState>(initialLive);
  const raf = useRef(0);

  const gateDb = gateFromNoiseFloor(settings.noiseFloorDb);
  const trackerOptions = useRef({
    a4Hz: settings.a4Hz,
    gateDb,
    tolerance: settings.toleranceCents,
  });

  // Keep the running tracker (and the options for the next start) in sync.
  useEffect(() => {
    trackerOptions.current = { a4Hz: settings.a4Hz, gateDb, tolerance: settings.toleranceCents };
    tracker.current?.update({
      a4Hz: settings.a4Hz,
      gateDb,
      ...(settings.toleranceCents ? { toleranceCents: settings.toleranceCents } : {}),
    });
  }, [settings.a4Hz, gateDb, settings.toleranceCents]);

  const stop = useCallback(async () => {
    cancelAnimationFrame(raf.current);
    const s = session.current;
    session.current = null;
    tracker.current = null;
    latest.current = initialLive;
    setLive(initialLive);
    setStatus('idle');
    await s?.stop();
  }, []);

  const start = useCallback(async () => {
    if (session.current) return;
    setStatus('starting');
    setError(null);
    try {
      const s = await openMicrophone();
      session.current = s;
      const o = trackerOptions.current;
      const t = new NoteTracker({
        a4Hz: o.a4Hz,
        gateDb: o.gateDb,
        ...(o.tolerance ? { toleranceCents: o.tolerance } : {}),
        toEventTime: () => performance.now(),
      });
      tracker.current = t;
      let avgCost = 0;
      s.onFrame((frame) => {
        // The worklet clock has 1 ms resolution in Chrome → show a running average.
        avgCost = avgCost === 0 ? frame.costMs : avgCost * 0.95 + frame.costMs * 0.05;
        for (const e of t.process(frame)) noteBus.emit(e);
        for (const l of frameListeners.current) l(frame);
        const c = frame.candidates[0];
        const freq = c?.frequency ?? null;
        latest.current = {
          levelDb: frame.levelDb,
          gateDb: trackerOptions.current.gateDb,
          frequency: freq,
          clarity: c?.clarity ?? 0,
          note: t.note,
          cents:
            t.note !== null && freq
              ? Math.round((frequencyToMidiFloat(freq, trackerOptions.current.a4Hz) - t.note) * 100)
              : null,
          costMs: avgCost,
        };
      });
      const tick = () => {
        setLive(latest.current);
        raf.current = requestAnimationFrame(tick);
      };
      raf.current = requestAnimationFrame(tick);
      setInfo(s.info);
      setStatus('running');
    } catch (err) {
      setError(err instanceof MicError ? err.code : 'MIC_FAILED');
      setStatus('error');
    }
  }, []);

  // Release the microphone when the component goes away.
  useEffect(() => () => void stop(), [stop]);

  /** Raw analysis frames, e.g. for calibration. */
  const onFrame = useCallback((listener: (f: AnalysisFrame) => void) => {
    frameListeners.current.add(listener);
    return () => {
      frameListeners.current.delete(listener);
    };
  }, []);

  return { status, error, info, live, start, stop, onFrame };
}
