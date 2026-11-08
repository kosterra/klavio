import { useSession } from '../auth/session';
import type { MascotMood } from './Mascot';
import { Figure } from './Figure';

/**
 * The learner's companion: the active profile's figure (Klavi when no profile
 * is chosen yet), in the given mood.
 */
export function Buddy({ mood, size, label }: { mood?: MascotMood; size?: number; label?: string }) {
  const { activeProfile } = useSession();
  return <Figure avatar={activeProfile?.avatar ?? 'klavi'} mood={mood} size={size} label={label} />;
}
