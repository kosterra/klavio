import { useCallback, useEffect, useState } from 'react';
import { localIsoDate, type ProgressDto } from '@klavio/shared';
import { endpoints } from '../api/endpoints';
import { useSession } from '../auth/session';

/** Lesson progress and today's practice of the active profile. */
export function useProgress() {
  const { activeProfile } = useSession();
  const profileId = activeProfile?.id;
  const [progress, setProgress] = useState<ProgressDto | null>(null);
  const [error, setError] = useState<unknown>(null);

  const reload = useCallback(async () => {
    try {
      setProgress(await endpoints.progress(localIsoDate()));
      setError(null);
    } catch (err) {
      setError(err);
    }
  }, []);

  useEffect(() => {
    if (!profileId) return;
    let cancelled = false;
    endpoints.progress(localIsoDate()).then(
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
  }, [profileId]);

  const completed = new Set(
    Object.entries(progress?.lessons ?? {})
      .filter(([, p]) => p.bestStars > 0)
      .map(([id]) => id),
  );
  return { progress, completed, error, reload };
}
