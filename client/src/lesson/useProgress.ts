import { useCallback, useEffect, useState } from 'react';
import { LESSONS, localIsoDate, weekOf, type ProgressDto } from '@klavio/shared';
import { ApiError, isTransient } from '../api/client';
import { endpoints } from '../api/endpoints';
import { useSession } from '../auth/session';
import { KEYS, readJson, writeJson } from '../offline/storage';
import { readQueue, withQueuedResults } from '../offline/queue';

/**
 * Progress of the active profile: from the server (cached for offline use),
 * always including results that are still waiting to be synced.
 */
export async function loadProgress(
  profileId: string,
  /** a queued result to leave out (the one just being sent) */
  without?: string,
): Promise<ProgressDto> {
  const date = localIsoDate();
  const key = KEYS.progressPrefix + profileId;
  let progress: ProgressDto;
  try {
    progress = await endpoints.progress(date, profileId);
    writeJson(key, progress);
  } catch (err) {
    // no connection or the server busy: what this device knows
    if (!isTransient(err)) throw err;
    const cached = readJson<ProgressDto>(key);
    progress = cached ?? { lessons: {}, today: { date, seconds: 0, xp: 0 }, weekDays: [] };
    // the cache may be from an earlier day
    if (progress.today.date !== date)
      progress = { ...progress, today: { date, seconds: 0, xp: 0 } };
    // a cache from an earlier week (or from before week days existed)
    const monday = weekOf(date);
    progress = { ...progress, weekDays: (progress.weekDays ?? []).filter((d) => d >= monday) };
  }
  return withQueuedResults(
    progress,
    readQueue().filter((q) => q.id !== without),
    profileId,
  );
}

/**
 * The server no longer knows this profile or session (deleted on another
 * device, logged out elsewhere): the session is loaded again, which leads to
 * the profile picker or the login.
 */
function sessionGone(err: unknown): boolean {
  return (
    err instanceof ApiError &&
    (err.status === 401 || err.status === 404 || err.code === 'NO_ACTIVE_PROFILE')
  );
}

export function useProgress() {
  const { activeProfile, dataVersion, refresh } = useSession();
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
      if (sessionGone(err)) void refresh();
    }
  }, [profileId, refresh]);

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
        if (cancelled) return;
        setError(err);
        if (sessionGone(err)) void refresh();
      },
    );
    return () => {
      cancelled = true;
    };
  }, [profileId, dataVersion, refresh]);

  // the lessons really done …
  const played = new Set(
    Object.entries(progress?.lessons ?? {})
      .filter(([, p]) => p.bestStars > 0)
      .map(([id]) => id),
  );
  // … and the ones open as if done: without the learning path, all of them
  const completed = activeProfile?.pathOff ? new Set(LESSONS.map((l) => l.id)) : played;
  return { progress, completed, played, error, reload };
}
