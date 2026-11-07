import type { CSSProperties, ReactNode } from 'react';
import type { WorldId } from './worlds';
import classes from './LearningPath.module.css';

/** Height of the landscape strip at the bottom of every world. */
export const SCENERY_HEIGHT = 40;

const HILL = 'var(--world-hill)';
const HILL2 = 'var(--world-hill-2)';
const DARK = 'var(--chapter-dark)';
const LIGHT = 'var(--chapter-light)';
const SURFACE = 'var(--klavio-surface)';

/** One repeating tile of each landscape (own artwork), drawn into a 40 px high strip. */
const TILES: Record<WorldId, { width: number; draw: ReactNode }> = {
  // Tasten-Tal: rolling hills with a little keyboard lying in the grass
  keys: {
    width: 150,
    draw: (
      <>
        <path d="M0 40 V22 Q37 4 75 18 T150 22 V40 Z" fill={HILL} />
        <path d="M0 40 V32 Q40 22 80 30 T150 32 V40 Z" fill={HILL2} />
        <g transform="translate(96 22) rotate(-6)">
          <rect x="0" y="0" width="34" height="13" rx="3" fill={DARK} opacity="0.55" />
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={2 + i * 6} y="2" width="5" height="9" rx="1" fill={SURFACE} />
          ))}
          {[6, 12, 24].map((x) => (
            <rect key={x} x={x} y="2" width="3" height="5" rx="0.8" fill={DARK} />
          ))}
        </g>
      </>
    ),
  },
  // Hand-Wald: round trees on a meadow
  forest: {
    width: 76,
    draw: (
      <>
        <rect x="0" y="34" width="76" height="6" fill={HILL} />
        <rect x="18" y="22" width="5" height="14" rx="2" fill={DARK} opacity="0.35" />
        <circle cx="20.5" cy="18" r="11" fill={HILL2} />
        <circle cx="16" cy="14" r="4" fill={SURFACE} opacity="0.35" />
        <rect x="52" y="27" width="4" height="9" rx="2" fill={DARK} opacity="0.35" />
        <circle cx="54" cy="24" r="8" fill={HILL} />
      </>
    ),
  },
  // Noten-Meer: waves, with five staff lines in the water
  sea: {
    width: 64,
    draw: (
      <>
        <path d="M0 22 Q16 13 32 22 T64 22 V40 H0 Z" fill={HILL} />
        {[27, 30.5, 34, 37.5].map((y) => (
          <line key={y} x1="0" y1={y} x2="64" y2={y} stroke={HILL2} strokeWidth="1.2" />
        ))}
        <path d="M6 20 Q12 16 18 18" stroke={SURFACE} strokeWidth="2" fill="none" opacity="0.6" />
      </>
    ),
  },
  // Lieder-Dorf: little houses with pointed roofs
  village: {
    width: 108,
    draw: (
      <>
        <rect x="0" y="36" width="108" height="4" fill={HILL} />
        <rect x="12" y="22" width="24" height="16" fill={HILL2} />
        <path d="M8 24 L24 10 L40 24 Z" fill={LIGHT} opacity="0.55" />
        <rect x="21" y="28" width="6" height="10" rx="1" fill={SURFACE} opacity="0.7" />
        <rect x="62" y="26" width="18" height="12" fill={HILL} />
        <path d="M58 27 L71 16 L84 27 Z" fill={HILL2} />
        <rect x="68" y="30" width="5" height="5" fill={SURFACE} opacity="0.7" />
        <rect x="94" y="28" width="3" height="9" fill={DARK} opacity="0.3" />
        <circle cx="95.5" cy="26" r="5" fill={HILL} />
      </>
    ),
  },
  // Rhythmus-Berg: peaks with snow caps
  mountain: {
    width: 120,
    draw: (
      <>
        <path d="M0 40 V28 L22 14 L40 28 L66 4 L92 28 L106 20 L120 28 V40 Z" fill={HILL} />
        <path d="M59 10.5 L66 4 L73 10.5 L69 13 L66 10 L63 13 Z" fill={SURFACE} opacity="0.85" />
        <path d="M0 40 V34 L30 26 L58 36 L88 30 L120 34 V40 Z" fill={HILL2} />
      </>
    ),
  },
  // Bass-Höhle: stalagmites with glowing crystals
  cave: {
    width: 96,
    draw: (
      <>
        <path
          d="M0 40 V30 L10 14 L18 30 L28 20 L36 30 L52 8 L64 30 L76 22 L88 30 L96 30 V40 Z"
          fill={HILL2}
        />
        <path d="M44 34 L48 22 L52 34 Z" fill="var(--mantine-color-yellow-3)" opacity="0.9" />
        <path d="M80 36 L83 27 L86 36 Z" fill="var(--mantine-color-cyan-3)" opacity="0.9" />
        <rect x="0" y="36" width="96" height="4" fill={HILL} />
      </>
    ),
  },
  // Brücken-Stadt: rooftops and the arches of a bridge
  city: {
    width: 120,
    draw: (
      <>
        <rect x="6" y="16" width="20" height="20" fill={HILL2} />
        <path d="M4 17 L16 6 L28 17 Z" fill={LIGHT} opacity="0.6" />
        <rect x="30" y="22" width="16" height="14" fill={HILL} />
        <rect x="96" y="12" width="14" height="24" fill={HILL2} />
        <path d="M94 13 L103 4 L112 13 Z" fill={LIGHT} opacity="0.6" />
        <path d="M46 36 V30 Q58 18 70 30 Q82 18 94 30 V36 Z" fill={HILL} />
        <rect x="0" y="34" width="120" height="6" fill={HILL2} />
        <rect x="12" y="22" width="5" height="5" fill={SURFACE} opacity="0.7" />
        <rect x="100" y="18" width="5" height="5" fill={SURFACE} opacity="0.7" />
      </>
    ),
  },
  // Sternen-Nacht: dark hills under twinkling stars
  night: {
    width: 110,
    draw: (
      <>
        <path d="M0 40 V26 Q28 10 55 24 T110 26 V40 Z" fill={HILL2} />
        <path d="M0 40 V34 Q30 26 60 32 T110 34 V40 Z" fill={DARK} opacity="0.35" />
        <path
          d="M20 8 L21.5 11.5 L25 13 L21.5 14.5 L20 18 L18.5 14.5 L15 13 L18.5 11.5 Z"
          fill="var(--mantine-color-yellow-4)"
        />
        <circle cx="70" cy="10" r="1.8" fill="var(--mantine-color-yellow-3)" />
        <circle cx="92" cy="6" r="1.4" fill="var(--mantine-color-yellow-3)" />
        <circle cx="46" cy="4" r="1.2" fill="var(--mantine-color-yellow-3)" />
      </>
    ),
  },
};

/** The landscape along the bottom edge of a world, repeated across the full width. */
export function Scenery({
  world,
  chapterId,
  height,
  snowy = false,
}: {
  world: WorldId;
  chapterId: string;
  height: number;
  /** Christmas season: snowdrifts over the landscape */
  snowy?: boolean;
}) {
  const tile = TILES[world];
  const id = `scenery-${chapterId}`;
  return (
    <svg className={classes.scenery} aria-hidden>
      <defs>
        <pattern
          id={id}
          patternUnits="userSpaceOnUse"
          width={tile.width}
          height={SCENERY_HEIGHT}
          y={height - SCENERY_HEIGHT}
        >
          {tile.draw}
        </pattern>
        <pattern
          id={`${id}-snow`}
          patternUnits="userSpaceOnUse"
          width={56}
          height={SCENERY_HEIGHT}
          y={height - SCENERY_HEIGHT}
        >
          <path
            d="M0 41 V31 Q14 23 28 30 T56 31 V41 Z"
            fill="var(--klavio-snow)"
            stroke="var(--klavio-snow-edge)"
            strokeWidth="1.5"
          />
          <circle cx="40" cy="31" r="1.6" fill="var(--klavio-snow)" />
        </pattern>
      </defs>
      <rect
        x="0"
        y={height - SCENERY_HEIGHT}
        width="100%"
        height={SCENERY_HEIGHT}
        fill={`url(#${id})`}
      />
      {snowy && (
        <rect
          x="0"
          y={height - SCENERY_HEIGHT}
          width="100%"
          height={SCENERY_HEIGHT}
          fill={`url(#${id}-snow)`}
        />
      )}
    </svg>
  );
}

/** Gate arching over the road where a new world begins. */
export function WorldGate({ style, snowy = false }: { style: CSSProperties; snowy?: boolean }) {
  return (
    <svg
      className={classes.gate}
      style={style}
      width={64}
      height={40}
      viewBox="0 0 64 40"
      aria-hidden
    >
      <rect x="2" y="10" width="9" height="30" rx="3" fill="var(--chapter-color)" />
      <rect x="53" y="10" width="9" height="30" rx="3" fill="var(--chapter-color)" />
      <path
        d="M4 14 Q32 -6 60 14"
        stroke="var(--chapter-light)"
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="32" cy="4.5" r="4" fill="var(--mantine-color-yellow-5)" />
      <rect x="4" y="12" width="5" height="3" rx="1.5" fill="rgb(255 255 255 / 40%)" />
      <rect x="55" y="12" width="5" height="3" rx="1.5" fill="rgb(255 255 255 / 40%)" />
      {snowy && (
        <>
          {/* snow on the arch and a little garland */}
          <path
            d="M8 9 Q32 -8 56 9 Q50 6 44 7 Q38 2 32 3 Q26 2 20 7 Q14 6 8 9 Z"
            fill="var(--klavio-snow)"
          />
          {[14, 24, 40, 50].map((x, i) => (
            <circle
              key={x}
              cx={x}
              cy={[11, 6.5, 6.5, 11][i]! + 3}
              r="2.4"
              fill={i % 2 ? 'var(--mantine-color-yellow-5)' : 'var(--mantine-color-red-5)'}
            />
          ))}
        </>
      )}
    </svg>
  );
}

/** Clouds over a world that has not been reached yet; `lifting` blows them away once. */
export function Fog({ lifting = false }: { lifting?: boolean }) {
  const cloud = (x: string, y: number, scale: number, k: number) => (
    <svg
      key={k}
      className={classes.cloud}
      style={{ left: x, top: y, width: 120 * scale, height: 56 * scale }}
      viewBox="0 0 120 56"
      aria-hidden
    >
      <path
        d="M18 52 Q2 52 4 38 Q6 26 22 28 Q24 10 44 12 Q54 0 70 8 Q88 2 94 20 Q114 18 116 36 Q118 52 100 52 Z"
        fill="var(--klavio-fog-cloud)"
      />
    </svg>
  );
  return (
    <div
      className={`${classes.fog} ${lifting ? classes.fogLift : ''}`}
      data-testid={lifting ? 'fog-lifting' : 'fog'}
      aria-hidden
    >
      {cloud('42%', 8, 0.9, 0)}
      {cloud('58%', 34, 1.1, 1)}
      {cloud('30%', 52, 0.7, 2)}
    </div>
  );
}

/** Gentle snowfall over the whole map (Christmas season). */
export function Snowfall({ height }: { height: number }) {
  return (
    <div className={classes.snowfall} aria-hidden>
      {Array.from({ length: Math.round(height / 45) }, (_, i) => {
        // deterministic spread: golden-ratio steps across the width
        const left = ((i * 61.8) % 100).toFixed(1);
        const size = 4 + ((i * 7) % 5);
        return (
          <span
            key={i}
            className={classes.flake}
            style={
              {
                left: `${left}%`,
                width: size,
                height: size,
                animationDelay: `${-((i * 1.7) % 12)}s`,
                animationDuration: `${9 + ((i * 3) % 6)}s`,
                '--fall': `${height}px`,
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
