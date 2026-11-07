// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { LESSONS } from '@klavio/shared';
import { isTooOld, withQueuedResults, type QueuedResult } from './queue';

const base = {
  lessons: { [LESSONS[0]!.id]: { bestStars: 1, completions: 1 } },
  today: { date: '2026-11-07', seconds: 60, xp: 0 },
};
const item = (over: Partial<QueuedResult>): QueuedResult => ({
  id: 'x',
  userId: 'u',
  profileId: 'p1',
  lessonId: LESSONS[1]!.id,
  mistakes: 0,
  durationSec: 120,
  localDate: '2026-11-07',
  queuedAt: 1,
  ...over,
});

describe('offline queue', () => {
  it('shows queued results as completed (best stars, practice time)', () => {
    const p = withQueuedResults(
      base,
      [item({}), item({ lessonId: LESSONS[0]!.id, mistakes: 0 }), item({ profileId: 'other' })],
      'p1',
    );
    expect(p.lessons[LESSONS[1]!.id]).toEqual({ bestStars: 3, completions: 1 });
    expect(p.lessons[LESSONS[0]!.id]).toEqual({ bestStars: 3, completions: 2 });
    expect(p.today.seconds).toBe(60 + 120 + 120);
  });

  it('does not add practice time of other days to today', () => {
    expect(withQueuedResults(base, [item({ localDate: '2026-11-06' })], 'p1').today.seconds).toBe(
      60,
    );
  });

  it('knows which results are too old to sync', () => {
    expect(isTooOld(item({ localDate: '2026-10-20' }), '2026-11-07')).toBe(true);
    expect(isTooOld(item({ localDate: '2026-10-25' }), '2026-11-07')).toBe(false);
  });
});
