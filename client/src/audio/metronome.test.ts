import { describe, expect, it, vi } from 'vitest';
import { contextToPerformanceTime } from './metronome';

const fakeContext = (over: Partial<AudioContext> & { stamp?: AudioTimestamp }) =>
  ({
    currentTime: 10,
    outputLatency: 0.02,
    baseLatency: 0.01,
    getOutputTimestamp: () => over.stamp ?? { contextTime: 0, performanceTime: 0 },
    ...over,
  }) as unknown as AudioContext;

describe('audio clock → performance clock', () => {
  it('uses the output timestamp when it is plausible', () => {
    vi.spyOn(performance, 'now').mockReturnValue(5000);
    // the speaker currently plays context time 9.97 s, which happened at 4990 ms
    const map = contextToPerformanceTime(
      fakeContext({ stamp: { contextTime: 9.97, performanceTime: 4990 } }),
    );
    expect(map(11)).toBeCloseTo(6020);
  });

  it('falls back to now + latency when the context just started (zeros)', () => {
    vi.spyOn(performance, 'now').mockReturnValue(5000);
    const map = contextToPerformanceTime(fakeContext({ currentTime: 0 }));
    // 0.25 s ahead + 30 ms latency
    expect(map(0.25)).toBeCloseTo(5280);
  });

  it('falls back when the timestamp is stale', () => {
    vi.spyOn(performance, 'now').mockReturnValue(5000);
    const map = contextToPerformanceTime(
      fakeContext({ stamp: { contextTime: 1, performanceTime: 100 } }),
    );
    expect(map(11)).toBeCloseTo(6030);
  });
});
