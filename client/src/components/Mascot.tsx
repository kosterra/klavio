import type { Outfit as OutfitId } from '@klavio/shared';
import { Outfit, type Head } from './Outfit';
import classes from './Mascot.module.css';

export type MascotMood = 'happy' | 'cheer' | 'think' | 'listen';

interface Props {
  mood?: MascotMood;
  size?: number;
  /** When omitted the mascot is decorative and hidden from screen readers. */
  label?: string;
  /** No motion (small avatars in lists and menus). */
  still?: boolean;
  /** the wardrobe piece Klavi wears */
  outfit?: OutfitId | null;
}

/** Klavi's head, for the wardrobe (the note head; the stem stays free). */
const KLAVI_HEAD: Head = { cx: 54, top: 54, r: 40, eyesY: 90, eyeGap: 16, chin: 128 };

/**
 * "Klavi" — the app's own mascot: a round note-head with a stem-antenna.
 * Original artwork, pure SVG, no third-party IP.
 */
export function Mascot({ mood = 'happy', size = 120, label, still = false, outfit }: Props) {
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true };
  return (
    <svg
      viewBox="0 0 120 140"
      width={size}
      height={(size * 140) / 120}
      className={still ? classes.still : mood === 'cheer' ? classes.bounce : classes.idle}
      {...a11y}
    >
      {/* stem + flag */}
      <rect x="86" y="8" width="7" height="70" rx="3.5" fill="#1c2559" />
      <path d="M93 10 q22 8 14 30 q-4-14-14-14z" fill="#ffb703" />
      {/* body */}
      <ellipse cx="58" cy="92" rx="46" ry="40" fill="#3b5bdb" />
      <ellipse cx="46" cy="76" rx="18" ry="10" fill="#5c7cfa" opacity="0.6" />
      {/* cheeks */}
      <circle cx="30" cy="104" r="7" fill="#ff8fab" opacity="0.7" />
      <circle cx="86" cy="104" r="7" fill="#ff8fab" opacity="0.7" />
      {/* eyes */}
      {mood === 'cheer' ? (
        <>
          <path
            d="M34 92 q8-10 16 0"
            stroke="#fff"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M66 92 q8-10 16 0"
            stroke="#fff"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
        </>
      ) : (
        <g className={`${classes.part} ${classes.blink}`}>
          <circle cx="42" cy="90" r="9" fill="#fff" />
          <circle cx="74" cy="90" r="9" fill="#fff" />
          <circle
            cx={mood === 'think' ? 45 : 43}
            cy={mood === 'think' ? 86 : 91}
            r="4.5"
            fill="#1c2559"
          />
          <circle
            cx={mood === 'think' ? 77 : 75}
            cy={mood === 'think' ? 86 : 91}
            r="4.5"
            fill="#1c2559"
          />
        </g>
      )}
      {/* mouth */}
      {mood === 'think' ? (
        <path d="M50 112 h16" stroke="#1c2559" strokeWidth="4" strokeLinecap="round" />
      ) : mood === 'listen' ? (
        <ellipse cx="58" cy="112" rx="5" ry="6" fill="#1c2559" />
      ) : (
        <path
          d="M46 108 q12 12 24 0"
          stroke="#1c2559"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      )}
      {mood === 'listen' && (
        <g stroke="#ffb703" strokeWidth="4" fill="none" strokeLinecap="round">
          <path d="M8 80 q-6 12 0 24" />
          <path d="M112 80 q6 12 0 24" />
        </g>
      )}
      {outfit && <Outfit id={outfit} head={KLAVI_HEAD} />}
    </svg>
  );
}
