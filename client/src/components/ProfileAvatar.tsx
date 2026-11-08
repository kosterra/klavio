import type { Avatar, Outfit } from '@klavio/shared';
import { Figure } from './Figure';
import type { MascotMood } from './Mascot';

/**
 * A profile's figure in a round frame (profile picker, menu, figure choice) —
 * the same drawing as the companion; still in menus, alive where figures are chosen.
 */
export function ProfileAvatar({
  avatar,
  size = 64,
  label,
  alive = false,
  mood,
  outfit,
}: {
  avatar: Avatar;
  size?: number;
  label?: string;
  /** Breathing, blinking, glancing (where figures are chosen); still by default. */
  alive?: boolean;
  mood?: MascotMood;
  /** the wardrobe piece the figure wears */
  outfit?: Outfit | null;
}) {
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true };
  // Klavi is taller than wide (note stem) → a bit smaller inside the frame
  const inner = avatar === 'klavi' ? size * 0.68 : size * 0.86;
  return (
    <span
      {...a11y}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 'none',
        width: size,
        height: size,
        borderRadius: '50%',
        // alive figures may pop out of the frame a little when they hop
        overflow: alive ? 'visible' : 'hidden',
        background:
          avatar === 'klavi' ? 'var(--klavio-avatar-bg-klavi)' : 'var(--klavio-avatar-bg)',
      }}
    >
      <Figure avatar={avatar} size={inner} still={!alive} mood={mood} outfit={outfit} />
    </span>
  );
}
