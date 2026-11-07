let context: AudioContext | null = null;
let clickBuffer: AudioBuffer | null = null;

function ctx(): AudioContext | null {
  if (typeof AudioContext === 'undefined') return null;
  context ??= new AudioContext({ latencyHint: 'interactive' });
  if (context.state === 'suspended') void context.resume();
  if (!clickBuffer) {
    // A short filtered noise burst: clearly audible, but without a stable pitch,
    // so the microphone's pitch detection never takes it for a note.
    const len = Math.round(context.sampleRate * 0.03);
    clickBuffer = context.createBuffer(1, len, context.sampleRate);
    const d = clickBuffer.getChannelData(0);
    let s = 7;
    for (let i = 0; i < len; i++) {
      s = (s * 1664525 + 1013904223) >>> 0;
      const noise = (s / 2 ** 32) * 2 - 1;
      d[i] = noise * Math.exp(-i / (len / 6));
    }
  }
  return context;
}

/**
 * Maps audio-clock times to performance.now() times, i.e. to the moment the
 * sound actually leaves the speaker. `getOutputTimestamp()` includes the output
 * pipeline delay, but right after the context starts it reports zeros or stale
 * values — then fall back to "now + output latency".
 */
export function contextToPerformanceTime(ac: AudioContext): (contextTime: number) => number {
  const now = performance.now();
  const latencySec = (ac.outputLatency || 0) + (ac.baseLatency || 0);
  const fallback = (t: number) => now + (t - ac.currentTime + latencySec) * 1000;
  const stamp = ac.getOutputTimestamp?.();
  if (!stamp?.performanceTime || stamp.contextTime === undefined) return fallback;
  const viaStamp = (t: number) => stamp.performanceTime! + (t - stamp.contextTime!) * 1000;
  // plausible only if "now" maps to roughly now (+ up to half a second of latency)
  const drift = viaStamp(ac.currentTime) - now;
  return drift >= -50 && drift <= 500 ? viaStamp : fallback;
}

export interface MetronomeRun {
  /** performance.now() time (ms) at which each scheduled beat is heard. */
  beatTimes: number[];
  stop(): void;
}

/**
 * Schedules `beats` clicks at `tempo` (beats per minute) on the audio clock and
 * returns when each one actually reaches the speaker, in performance.now() time
 * — so that output latency (e.g. Bluetooth) is accounted for when scoring.
 * Beats with index in `accents` are louder (e.g. the first beat of a bar).
 */
export function runMetronome(beats: number, tempo: number, accents: number[] = []): MetronomeRun {
  const ac = ctx();
  const beatSec = 60 / tempo;
  if (!ac || !clickBuffer) {
    const now = performance.now() + 300;
    return {
      beatTimes: Array.from({ length: beats }, (_, i) => now + i * beatSec * 1000),
      stop() {},
    };
  }
  const start = ac.currentTime + 0.25;
  const toPerf = contextToPerformanceTime(ac);

  const sources: AudioBufferSourceNode[] = [];
  const beatTimes: number[] = [];
  for (let i = 0; i < beats; i++) {
    const t = start + i * beatSec;
    const src = ac.createBufferSource();
    src.buffer = clickBuffer;
    const g = ac.createGain();
    g.gain.value = accents.includes(i) ? 0.9 : 0.45;
    src.connect(g).connect(ac.destination);
    src.start(t);
    sources.push(src);
    beatTimes.push(toPerf(t));
  }
  return {
    beatTimes,
    stop() {
      for (const s of sources) {
        try {
          s.stop();
        } catch {
          /* already finished */
        }
      }
    },
  };
}
