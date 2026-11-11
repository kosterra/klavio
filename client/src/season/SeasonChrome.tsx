import { hasPiece } from './season';
import { useSeason } from './useSeason';
import classes from './SeasonChrome.module.css';

/*
 * The festive time outside the start page: in the header, on the logo, in the
 * navigation – and a reindeer peeking in at the top right. Decoration only
 * (aria-hidden, no pointer events), own artwork.
 */

const INK = 'var(--klavio-comic-line)';

/** A fir garland with baubles hanging under the header. */
export function HeaderGarland() {
  const season = useSeason();
  if (!hasPiece(season, 'garland')) return null;
  const colors = ['red', 'yellow', 'blue', 'grape', 'orange'];
  return (
    <svg
      className={classes.garland}
      viewBox="0 0 1200 22"
      preserveAspectRatio="none"
      aria-hidden
      data-testid="season-garland"
    >
      <path
        d={`M0 4 ${Array.from({ length: 12 }, (_, i) => `Q${i * 100 + 50} 20 ${(i + 1) * 100} 4`).join(' ')}`}
        fill="none"
        stroke="var(--mantine-color-green-7)"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d={`M0 4 ${Array.from({ length: 12 }, (_, i) => `Q${i * 100 + 50} 20 ${(i + 1) * 100} 4`).join(' ')}`}
        fill="none"
        stroke="var(--mantine-color-green-5)"
        strokeWidth="2"
        strokeDasharray="3 5"
      />
      {Array.from({ length: 12 }, (_, i) => (
        <circle
          key={i}
          cx={i * 100 + 50}
          cy="15"
          r="4"
          fill={`var(--mantine-color-${colors[i % colors.length]}-5)`}
        />
      ))}
    </svg>
  );
}

/** A Santa cap on the logo. */
export function LogoCap() {
  const season = useSeason();
  if (!hasPiece(season, 'logoCap')) return null;
  return (
    <svg className={classes.logoCap} viewBox="0 0 40 30" aria-hidden data-testid="season-logo-cap">
      <path
        d="M4 24 Q14 2 30 6 Q36 8 36 18"
        fill="var(--mantine-color-red-6)"
        stroke={INK}
        strokeWidth="1.6"
      />
      <circle cx="36" cy="19" r="4" fill="#fff" stroke={INK} strokeWidth="1.4" />
      <rect
        x="1"
        y="21"
        width="28"
        height="7"
        rx="3.5"
        fill="#fff"
        stroke={INK}
        strokeWidth="1.4"
      />
    </svg>
  );
}

/** A reindeer with a red nose, peeking in from the top right corner. */
export function PeekingReindeer() {
  const season = useSeason();
  if (!hasPiece(season, 'reindeer')) return null;
  const line = { stroke: INK, strokeWidth: 2.5, strokeLinejoin: 'round' as const };
  return (
    <svg
      className={classes.reindeer}
      viewBox="0 0 140 140"
      aria-hidden
      data-testid="season-reindeer"
    >
      {/* antlers */}
      <path
        d="M48 38 Q36 20 42 4 M42 22 Q30 20 26 10 M92 38 Q104 20 98 4 M98 22 Q110 20 114 10"
        stroke="var(--mantine-color-orange-9)"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      {/* ears */}
      <ellipse
        cx="38"
        cy="50"
        rx="12"
        ry="6"
        fill="var(--mantine-color-orange-8)"
        {...line}
        transform="rotate(-30 38 50)"
      />
      <ellipse
        cx="102"
        cy="50"
        rx="12"
        ry="6"
        fill="var(--mantine-color-orange-8)"
        {...line}
        transform="rotate(30 102 50)"
      />
      {/* neck and round head */}
      <path
        d="M50 140 Q48 100 56 84 H84 Q92 100 90 140 Z"
        fill="var(--mantine-color-orange-8)"
        {...line}
      />
      <circle cx="70" cy="62" r="28" fill="var(--mantine-color-orange-8)" {...line} />
      {/* muzzle */}
      <ellipse cx="70" cy="82" rx="20" ry="15" fill="var(--mantine-color-orange-2)" {...line} />
      <circle cx="59" cy="58" r="4.5" fill={INK} />
      <circle cx="81" cy="58" r="4.5" fill={INK} />
      <circle cx="60.5" cy="56.5" r="1.5" fill="#fff" />
      <circle cx="82.5" cy="56.5" r="1.5" fill="#fff" />
      {/* the red nose */}
      <circle
        className={classes.nose}
        cx="70"
        cy="76"
        r="8"
        fill="var(--mantine-color-red-6)"
        {...line}
      />
      <circle cx="67" cy="73" r="2.2" fill="rgb(255 255 255 / 70%)" />
      <path
        d="M62 89 Q70 95 78 89"
        stroke={INK}
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Snow on top of the navigation (the bottom bar on phones, the side menu). */
export function NavSnow({ place }: { place: 'bottom' | 'side' }) {
  const season = useSeason();
  if (!hasPiece(season, 'navSnow')) return null;
  return (
    <svg
      className={place === 'bottom' ? classes.snowBottom : classes.snowSide}
      viewBox="0 0 400 14"
      preserveAspectRatio="none"
      aria-hidden
      data-testid={`season-snow-${place}`}
    >
      <path
        d="M0 6 Q10 0 22 5 T48 4 T78 6 T110 3 T140 6 T172 4 T204 6 T236 3 T268 6 T300 4 T332 6 T364 3 T400 5 V14 H0 Z"
        fill="#fff"
        stroke="var(--mantine-color-gray-3)"
        strokeWidth="1"
      />
    </svg>
  );
}

/** Two bells with a red bow, in the navigation. */
export function NavBells() {
  const season = useSeason();
  if (!hasPiece(season, 'bells')) return null;
  const line = { stroke: INK, strokeWidth: 1.8, strokeLinejoin: 'round' as const };
  return (
    <svg className={classes.bells} viewBox="0 0 60 50" aria-hidden data-testid="season-bells">
      <g className={classes.bellLeft}>
        <path
          d="M14 14 Q6 18 6 32 L4 38 H28 L26 32 Q26 18 18 14 Z"
          fill="var(--mantine-color-yellow-4)"
          {...line}
        />
        <circle cx="16" cy="40" r="3" fill="var(--mantine-color-yellow-6)" {...line} />
      </g>
      <g className={classes.bellRight}>
        <path
          d="M42 14 Q34 18 34 32 L32 38 H56 L54 32 Q54 18 46 14 Z"
          fill="var(--mantine-color-yellow-4)"
          {...line}
        />
        <circle cx="44" cy="40" r="3" fill="var(--mantine-color-yellow-6)" {...line} />
      </g>
      <path
        d="M16 12 Q30 2 44 12"
        stroke="var(--mantine-color-red-6)"
        strokeWidth="4"
        fill="none"
      />
      <path
        d="M30 8 L20 2 L22 12 Z M30 8 L40 2 L38 12 Z"
        fill="var(--mantine-color-red-6)"
        {...line}
      />
    </svg>
  );
}
