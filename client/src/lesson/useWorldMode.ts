import { DEFAULT_JOURNEY_MIN_AGE, effectiveWorld, type WorldSet } from '@klavio/shared';
import { useSession } from '../auth/session';

/** Which worlds the active profile travels through: the kids' worlds or the journey. */
export function useWorldMode(): WorldSet {
  const { activeProfile, config } = useSession();
  if (!activeProfile) return 'kids';
  return effectiveWorld(activeProfile, config?.journeyMinAge ?? DEFAULT_JOURNEY_MIN_AGE);
}
