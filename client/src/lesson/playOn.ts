import { useCallback } from 'react';
import type { PlayOn } from '@klavio/shared';
import { endpoints } from '../api/endpoints';
import { useSession } from '../auth/session';

export type { PlayOn };

/** Before the choice lived with the profile: what this device remembered. */
const LEGACY_KEY = 'klavio-play-on';

function legacy(profileId: string | undefined): PlayOn | null {
  try {
    const v =
      (profileId && localStorage.getItem(`${LEGACY_KEY}:${profileId}`)) ||
      localStorage.getItem(LEGACY_KEY);
    return v === 'screen' || v === 'piano' ? v : null;
  } catch {
    return null;
  }
}

/**
 * Where the learner plays: on the real piano (microphone or digital piano)
 * or on the screen keys – what lessons and free play offer first. Kept with
 * the profile (on every device); set by the start-up questions, «Mein
 * Profil» and the choice at a lesson start.
 */
export function usePlayOn(): [PlayOn, (value: PlayOn) => Promise<void>] {
  const { activeProfile, refresh } = useSession();
  const value = activeProfile?.playOn ?? legacy(activeProfile?.id) ?? 'piano';
  const id = activeProfile?.id;
  const current = activeProfile?.playOn ?? null;
  const set = useCallback(
    async (next: PlayOn) => {
      if (!id || next === current) return;
      await endpoints.updateProfile(id, { playOn: next });
      await refresh();
    },
    [id, current, refresh],
  );
  return [value, set];
}
