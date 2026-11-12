import { beforeEach, describe, expect, it, vi } from 'vitest';
import { localIsoDate } from '@klavio/shared';
import { ApiError } from '../api/client';
import { endpoints } from '../api/endpoints';
import { enqueueResult, readQueue } from './queue';
import { flushQueue } from './sync';

vi.mock('../api/endpoints', () => ({
  endpoints: { completeLesson: vi.fn(), selectProfile: vi.fn() },
}));
const complete = vi.mocked(endpoints.completeLesson);

const result = (over: object = {}) => ({ stars: 3, ...over }) as never;
const queue = (profileId: string, lessonId: string) =>
  enqueueResult({
    userId: 'u',
    profileId,
    lessonId,
    mistakes: 0,
    durationSec: 60,
    localDate: localIsoDate(),
  });

describe('sending results played offline', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('oldest first, each with its profile and id – the session profile is never switched', async () => {
    const a = queue('lina', 'l1');
    const b = queue('tim', 'l2');
    complete.mockResolvedValue(result());
    const out = await flushQueue('u');
    expect(out.synced).toBe(2);
    expect(complete.mock.calls.map(([id, body]) => [id, body.profileId, body.resultId])).toEqual([
      ['l1', 'lina', a.id],
      ['l2', 'tim', b.id],
    ]);
    expect(endpoints.selectProfile).not.toHaveBeenCalled();
    expect(readQueue()).toEqual([]);
  });

  it('server away: stops and keeps the rest in order; refused for good: dropped', async () => {
    const a = queue('lina', 'l1');
    const b = queue('lina', 'l2');
    const c = queue('lina', 'l3');
    complete
      .mockRejectedValueOnce(new ApiError(404, 'NOT_FOUND'))
      .mockRejectedValueOnce(new ApiError(502, 'UNKNOWN'));
    const out = await flushQueue('u');
    expect(out.refused[a.id]?.status).toBe(404);
    expect(out.stoppedBy?.status).toBe(502);
    expect(readQueue().map((q) => q.id)).toEqual([b.id, c.id]);
  });

  it('logged out: the results wait for the next login', async () => {
    queue('lina', 'l1');
    complete.mockRejectedValueOnce(new ApiError(401, 'UNAUTHORIZED'));
    const out = await flushQueue('u');
    expect(out.stoppedBy?.status).toBe(401);
    expect(readQueue()).toHaveLength(1);
  });

  it('two calls at once send each result only once', async () => {
    queue('lina', 'l1');
    complete.mockResolvedValue(result());
    const [x, y] = await Promise.all([flushQueue('u'), flushQueue('u')]);
    expect(x.synced + y.synced).toBe(1);
    expect(complete).toHaveBeenCalledTimes(1);
  });
});
