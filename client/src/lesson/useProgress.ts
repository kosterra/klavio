import { useCallback, useEffect, useState } from 'react';
import { localIsoDate, type ProgressDto } from '@klavio/shared';
import { ApiError } from '../api/client';
import { endpoints } from '../api/endpoints';
import { useSession } from '../auth/session';
import { KEYS, readJson, writeJson } from '../offline/storage';
import { readQueue, withQueuedResults } from '../offline/queue';

/**
 * Progress of the active profile: from the server (cached for offline use),
 * always including results that are still waiting to be synced.
 */
export async function loadProgress(profileId: string): Promise<ProgressDto> {
  const date = localIsoDate();
  const key = KEYS.progressPrefix + profileId;
  let progress: ProgressDto;
  try {
    progress = await endpoints.progress(date);
    writeJson(key, progress);
  } catch (err) {
    if (!(err instanceof ApiError && err.code === 'NETWORK')) throw err;
    const cached = readJson<ProgressDto>(key);
    progress = cached ?? { lessons: {}, today: { date, seconds: 0, xp: 0 } };
    // the cache may be from an earlier day
    if (progress.today.date !== date)
      progress = { ...progress, today: { date, seconds: 0, xp: 0 } };
  }
  return withQueuedResults(progress, readQueue(), profileId);
}

export function useProgress() {
  const { activeProfile, dataVersion } = useSession();
  const profileId = activeProfile?.id;
  const [progress, setProgress] = useState<ProgressDto | null>(null);
  const [error, setError] = useState<unknown>(null);

  const reload = useCallback(async () => {
    if (!profileId) return;
    try {
      setProgress(await loadProgress(profileId));
      setError(null);
    } catch (err) {
      setError(err);
    }
  }, [profileId]);

  useEffect(() => {
    if (!profileId) return;
    let cancelled = false;
    loadProgress(profileId).then(
      (p) => {
        if (!cancelled) {
          setProgress(p);
          setError(null);
        }
      },
      (err: unknown) => {
        if (!cancelled) setError(err);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [profileId, dataVersion]);

  const completed = new Set(
    Object.entries(progress?.lessons ?? {})
      .filter(([, p]) => p.bestStars > 0)
      .map(([id]) => id),
  );
  return { progress, completed, error, reload };
}
