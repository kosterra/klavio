import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addDays, localIsoDate, type ProgressDto } from '@klavio/shared';
import { ApiError } from '../api/client';
import { endpoints } from '../api/endpoints';
import { addPractice, flushPractice, readPractice } from './practice';
import { withQueuedResults } from './queue';

vi.mock('../api/endpoints', () => ({ endpoints: { recordPractice: vi.fn() } }));
const record = vi.mocked(endpoints.recordPractice);

const today = localIsoDate();
const piece = (over: object = {}) =>
  addPractice({ userId: 'u', profileId: 'lina', localDate: today, seconds: 60, ...over });

describe('practice time outside lessons', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('shows at once in the day and the week, before it is sent', () => {
    piece();
    piece({ seconds: 30 });
    piece({ profileId: 'tim' });
    const server: ProgressDto = {
      lessons: {},
      today: { date: today, seconds: 120, xp: 0 },
      weekDays: [],
    };
    const shown = withQueuedResults(server, [], 'lina');
    expect(shown.today.seconds).toBe(210);
    expect(shown.weekDays).toEqual([today]);
  });

  it('is sent piece by piece with its own id; offline it waits', async () => {
    piece();
    piece({ seconds: 30 });
    record.mockRejectedValueOnce(new ApiError(0, 'NETWORK'));
    await flushPractice('u');
    expect(readPractice()).toHaveLength(2);
    record.mockResolvedValue(undefined as never);
    await flushPractice('u');
    expect(readPractice()).toEqual([]);
    const sent = record.mock.calls.slice(1).map(([b]) => [b.seconds, b.profileId]);
    expect(sent).toEqual([
      [60, 'lina'],
      [30, 'lina'],
    ]);
    expect(new Set(record.mock.calls.map(([b]) => b.pieceId)).size).toBe(2);
  });

  it('drops what the server refuses for good, and days too old to count', async () => {
    piece({ localDate: addDays(today, -20) });
    piece();
    record.mockRejectedValue(new ApiError(404, 'NOT_FOUND'));
    await flushPractice('u');
    expect(record).toHaveBeenCalledTimes(1);
    expect(readPractice()).toEqual([]);
  });
});
