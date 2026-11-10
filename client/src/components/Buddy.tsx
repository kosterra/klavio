import { useSession } from '../auth/session';
import { hasPiece } from '../season/season';
import { useSeason } from '../season/useSeason';
import type { MascotMood } from './Mascot';
import { Figure } from './Figure';

/**
 * The learner's companion: the active profile's figure (Klavi when no profile
 * is chosen yet), in the given mood – in Advent with a Santa cap, at New
 * Year with a party hat.
 */
export function Buddy({ mood, size, label }: { mood?: MascotMood; size?: number; label?: string }) {
  const { activeProfile } = useSession();
  const season = useSeason();
  const festive =
    season.phase === 'newyear' ? 'party' : hasPiece(season, 'cap') ? 'cap' : undefined;
  return (
    <Figure
      avatar={activeProfile?.avatar ?? 'klavi'}
      outfit={festive ?? activeProfile?.outfit}
      mood={mood}
      size={size}
      label={label}
    />
  );
}
