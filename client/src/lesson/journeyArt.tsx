import type { ReactNode } from 'react';
import type { JourneyWorldId } from './worlds';

/*
 * The adults' journey, drawn in the same comic style as the kids' worlds
 * (flat colours, dark outlines, own artwork): landmarks for the signposts and
 * the landscape strips along the bottom of every world.
 */

const INK = 'var(--klavio-comic-line)';
const C = 'var(--chapter-color)';
const LIGHT = 'var(--chapter-light)';
const DARK = 'var(--chapter-dark)';
const GLOSS = 'rgb(255 255 255 / 55%)';
const WOOD = '#b9773f';
const FIRE = 'var(--mantine-color-orange-5)';
const GLOW = 'var(--mantine-color-yellow-4)';
const SNOW = '#fff';
const line = { stroke: INK, strokeWidth: 3, strokeLinejoin: 'round' as const };
const thin = { ...line, strokeWidth: 2 };

const ground = () => <path d="M4 126 Q90 100 176 126 Z" fill="var(--world-hill-2)" {...line} />;

const fir = (x: number, y: number, s = 1) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x="-2" y="20" width="4" height="8" fill={WOOD} />
    <path d="M0 -6 L12 22 H-12 Z" fill="var(--mantine-color-green-8)" {...thin} />
  </g>
);

export const JOURNEY_LANDMARKS: Record<JourneyWorldId, ReactNode> = {
  // Alp: a chalet in the meadow, mountains behind
  alp: (
    <>
      <path d="M8 120 L58 44 L84 80 L122 26 L174 120 Z" fill={LIGHT} {...line} />
      <path d="M110 44 L122 26 L134 44 L128 41 L122 47 L116 41 Z" fill={SNOW} {...thin} />
      {ground()}
      <rect x="60" y="78" width="60" height="42" fill={WOOD} {...line} />
      <path d="M48 84 L90 52 L132 84 Z" fill={DARK} {...line} />
      <rect x="68" y="88" width="14" height="12" fill={GLOW} {...thin} />
      <rect x="98" y="88" width="14" height="12" fill={GLOW} {...thin} />
      <path d="M60 106 H120" stroke={INK} strokeWidth="3" />
      {[66, 74, 82, 98, 106, 114].map((x) => (
        <path key={x} d={`M${x} 106 V114`} stroke={INK} strokeWidth="2" />
      ))}
      {[22, 34, 150, 160].map((x, i) => (
        <circle
          key={x}
          cx={x}
          cy={116 - (i % 2) * 4}
          r="3.5"
          fill={i % 2 ? GLOW : 'var(--mantine-color-pink-4)'}
          {...thin}
          strokeWidth={1.5}
        />
      ))}
      <rect x="64" y="80" width="4" height="22" rx="2" fill={GLOSS} />
    </>
  ),
  // Tobel: a swaying footbridge across the wooded ravine
  tobel: (
    <>
      <rect x="54" y="52" width="72" height="74" fill={DARK} />
      <path d="M4 126 V44 L54 50 L66 126 Z" fill={C} {...line} />
      <path d="M176 126 V40 L126 48 L114 126 Z" fill={C} {...line} />
      {fir(18, 18)}
      {fir(38, 22, 0.8)}
      {fir(160, 14)}
      <path d="M52 50 Q90 76 128 48" stroke={WOOD} strokeWidth="7" fill="none" />
      <path d="M52 40 Q90 64 128 38" stroke={INK} strokeWidth="2" fill="none" />
      {[62, 74, 86, 98, 110, 120].map((x) => {
        const t = (x - 52) / 76;
        const deck = 50 + 4 * 26 * t * (1 - t) - 2 * t;
        const rope = 40 + 4 * 24 * t * (1 - t) - 2 * t;
        return <path key={x} d={`M${x} ${rope} V${deck}`} stroke={INK} strokeWidth="1.5" />;
      })}
      <path d="M52 50 Q90 76 128 48" stroke={INK} strokeWidth="2" fill="none" />
      <path
        d="M78 110 Q90 100 102 110"
        stroke="var(--mantine-color-cyan-3)"
        strokeWidth="4"
        fill="none"
      />
    </>
  ),
  // Schlucht: a waterfall between steep cliffs
  gorge: (
    <>
      <rect x="66" y="24" width="48" height="98" fill="var(--mantine-color-cyan-2)" {...line} />
      {[74, 84, 94, 104].map((x, i) => (
        <path
          key={x}
          d={`M${x} ${30 + (i % 2) * 8} V${110 - (i % 2) * 10}`}
          stroke={SNOW}
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.8"
        />
      ))}
      <path d="M4 126 L12 18 L62 26 L70 126 Z" fill={LIGHT} {...line} />
      <path d="M176 126 L168 12 L118 22 L110 126 Z" fill={LIGHT} {...line} />
      <path
        d="M20 40 L40 46 M26 70 L50 76 M140 36 L160 30 M132 80 L156 74"
        stroke={DARK}
        strokeWidth="2.5"
      />
      <ellipse cx="90" cy="122" rx="36" ry="7" fill="var(--mantine-color-cyan-3)" {...line} />
      <circle cx="64" cy="112" r="4" fill={SNOW} opacity="0.85" />
      <circle cx="118" cy="108" r="3" fill={SNOW} opacity="0.85" />
    </>
  ),
  // Stollen: the entrance of a mine with a cart full of notes
  mine: (
    <>
      <path d="M4 126 Q18 34 90 26 Q162 34 176 126 Z" fill={LIGHT} {...line} />
      <path d="M58 126 V74 Q90 44 122 74 V126 Z" fill="#1d1830" {...line} />
      <rect x="54" y="68" width="9" height="58" fill={WOOD} {...line} />
      <rect x="117" y="68" width="9" height="58" fill={WOOD} {...line} />
      <rect x="48" y="60" width="84" height="11" rx="2" fill={WOOD} {...line} />
      <circle cx="90" cy="80" r="6" fill={GLOW} {...thin} />
      <path d="M90 71 V74" stroke={INK} strokeWidth="2" />
      <path d="M66 124 L80 100 M114 124 L100 100" stroke={DARK} strokeWidth="3" />
      <path d="M14 104 H50 L46 120 H18 Z" fill={C} {...line} />
      <circle cx="24" cy="122" r="4" fill={INK} />
      <circle cx="42" cy="122" r="4" fill={INK} />
      <path d="M22 104 l4 -10 l6 6 l5 -9 l5 13" fill={GLOW} {...thin} />
      <path d="M150 112 L156 100 L162 112 Z" fill="var(--mantine-color-cyan-3)" {...thin} />
    </>
  ),
  // Glutkammer: boulders with glowing cracks around a lava pool
  embers: (
    <>
      {ground()}
      <path d="M8 126 Q10 70 46 64 Q78 62 82 126 Z" fill={DARK} {...line} />
      <path d="M100 126 Q104 50 140 48 Q174 52 174 126 Z" fill={DARK} {...line} />
      <path
        d="M30 84 L40 96 L34 108 M52 76 L58 92"
        stroke={GLOW}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M126 64 L134 82 L126 96 L136 112 M152 70 L150 88"
        stroke={GLOW}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx="90" cy="120" rx="30" ry="8" fill={FIRE} {...line} />
      <ellipse cx="84" cy="118" rx="12" ry="3" fill={GLOW} />
      {[
        [70, 90],
        [96, 76],
        [110, 96],
        [84, 60],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="2.5" fill={GLOW} />
      ))}
    </>
  ),
  // Die Hölle: a little devilish metronome in the flames
  hell: (
    <>
      <path
        d="M14 126 Q10 96 24 84 Q24 100 34 102 Q30 74 50 58 Q50 82 60 86 L66 126 Z"
        fill={FIRE}
        {...line}
      />
      <path
        d="M166 126 Q172 96 156 82 Q156 98 146 100 Q152 70 130 56 Q130 80 120 86 L114 126 Z"
        fill={FIRE}
        {...line}
      />
      <path d="M26 126 Q24 108 34 104 Q38 116 48 112 Q46 96 56 90 L60 126 Z" fill={GLOW} />
      <path d="M154 126 Q156 108 146 104 Q142 116 132 112 Q134 96 124 90 L120 126 Z" fill={GLOW} />
      {/* horns */}
      <path d="M78 34 Q66 22 74 6 Q76 20 86 30 Z" fill={DARK} {...line} />
      <path d="M102 34 Q114 22 106 6 Q104 20 94 30 Z" fill={DARK} {...line} />
      {/* body, face and pendulum */}
      <path d="M62 124 L76 30 L104 30 L118 124 Z" fill={C} {...line} />
      <path d="M78 48 l8 4 M102 48 l-8 4" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      <circle cx="83" cy="56" r="3" fill={GLOW} />
      <circle cx="97" cy="56" r="3" fill={GLOW} />
      <path
        d="M82 68 Q90 74 98 68"
        stroke={INK}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <rect x="74" y="80" width="32" height="34" rx="3" fill={LIGHT} {...thin} />
      <path d="M90 112 L104 84" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      <rect
        x="97"
        y="88"
        width="10"
        height="7"
        rx="2"
        fill={GLOW}
        {...thin}
        transform="rotate(-25 102 91)"
      />
      {/* tail */}
      <path
        d="M116 112 Q136 118 138 100"
        stroke={INK}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M132 100 L138 90 L144 100 Z" fill={DARK} {...thin} />
      <rect x="68" y="40" width="4" height="40" rx="2" fill={GLOSS} />
    </>
  ),
  // Kamin: a rope ladder up through the rock towards the light
  chimney: (
    <>
      <circle cx="90" cy="16" r="14" fill={GLOW} opacity="0.9" />
      <path
        d="M90 0 V6 M76 6 l4 4 M104 6 l-4 4"
        stroke={GLOW}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M14 126 L26 10 L76 8 L72 126 Z" fill={C} {...line} />
      <path d="M166 126 L156 6 L106 10 L108 126 Z" fill={C} {...line} />
      <path
        d="M36 30 L60 34 M30 70 L58 66 M124 40 L148 36 M120 88 L150 92"
        stroke={DARK}
        strokeWidth="2.5"
      />
      <path d="M82 14 V122 M98 14 V122" stroke={WOOD} strokeWidth="3" />
      {[24, 38, 52, 66, 80, 94, 108].map((y) => (
        <path key={y} d={`M82 ${y} H98`} stroke={WOOD} strokeWidth="4" strokeLinecap="round" />
      ))}
      <rect x="32" y="20" width="4" height="60" rx="2" fill={GLOSS} />
    </>
  ),
  // Gipfelgrat: a jagged ridge, a cairn and a flag on the highest point
  ridge: (
    <>
      <path
        d="M4 126 L28 84 L46 94 L76 50 L92 64 L120 36 L142 62 L160 52 L176 126 Z"
        fill={LIGHT}
        {...line}
      />
      <path d="M68 62 L76 50 L84 61 L80 59 L76 64 L72 59 Z" fill={SNOW} {...thin} />
      <path d="M110 50 L120 36 L130 50 L125 47 L120 52 L115 47 Z" fill={SNOW} {...thin} />
      <ellipse cx="120" cy="33" rx="9" ry="4" fill="var(--mantine-color-gray-5)" {...thin} />
      <ellipse cx="120" cy="27" rx="7" ry="3.5" fill="var(--mantine-color-gray-4)" {...thin} />
      <ellipse cx="120" cy="22" rx="5" ry="3" fill="var(--mantine-color-gray-5)" {...thin} />
      <path d="M120 20 V2" stroke={INK} strokeWidth="2.5" />
      <path d="M121 3 L142 8 L121 14 Z" fill={GLOW} {...thin} />
      <path
        d="M30 112 Q60 100 90 108 T150 104"
        stroke={DARK}
        strokeWidth="2"
        strokeDasharray="4 5"
        fill="none"
      />
    </>
  ),
  // Berghütte: a stone hut on a snowy shoulder, smoke from the chimney
  hut: (
    <>
      <path d="M4 126 L60 46 L96 70 L132 34 L176 126 Z" fill={LIGHT} {...line} />
      <path d="M120 50 L132 34 L144 50 L138 47 L132 53 L126 47 Z" fill={SNOW} {...thin} />
      <path d="M48 64 L60 46 L72 64 L66 61 L60 67 L54 61 Z" fill={SNOW} {...thin} />
      {ground()}
      <rect x="62" y="88" width="56" height="34" fill="var(--mantine-color-gray-5)" {...line} />
      <path d="M54 92 L90 66 L126 92 Z" fill={DARK} {...line} />
      <rect x="104" y="64" width="9" height="18" fill="var(--mantine-color-gray-6)" {...thin} />
      <path
        d="M108 60 q-6 -8 2 -14 q8 -6 2 -14"
        stroke="var(--mantine-color-gray-4)"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      <rect x="82" y="100" width="16" height="22" rx="2" fill={WOOD} {...thin} />
      <rect x="68" y="96" width="10" height="10" fill={GLOW} {...thin} />
      <rect x="102" y="96" width="10" height="10" fill={GLOW} {...thin} />
      <path
        d="M28 120 V96 M28 96 L42 100 L28 104"
        stroke={INK}
        strokeWidth="2.5"
        fill="var(--mantine-color-red-6)"
      />
    </>
  ),
};

const HILL = 'var(--world-hill)';
const HILL2 = 'var(--world-hill-2)';
const SURFACE = 'var(--klavio-surface)';

/** One repeating tile per journey world, drawn into a 40 px high strip. */
export const JOURNEY_TILES: Record<JourneyWorldId, { width: number; draw: ReactNode }> = {
  alp: {
    width: 160,
    draw: (
      <>
        <path d="M0 40 V26 Q40 14 80 24 T160 26 V40 Z" fill={HILL} />
        <rect x="112" y="23" width="18" height="13" fill={HILL2} />
        <path d="M108 25 L121 15 L134 25 Z" fill={DARK} opacity="0.45" />
        <rect x="118" y="28" width="5" height="5" fill={SURFACE} opacity="0.7" />
        <circle cx="30" cy="27" r="2" fill="var(--mantine-color-pink-4)" />
        <circle cx="52" cy="25" r="2" fill="var(--mantine-color-yellow-4)" />
      </>
    ),
  },
  tobel: {
    width: 70,
    draw: (
      <>
        <rect x="0" y="34" width="70" height="6" fill={HILL} />
        <path d="M8 36 L17 10 L26 36 Z" fill={HILL2} />
        <path d="M38 36 L45 18 L52 36 Z" fill={HILL} />
        <path d="M56 36 L62 22 L68 36 Z" fill={HILL2} />
      </>
    ),
  },
  gorge: {
    width: 90,
    draw: (
      <>
        <path d="M0 40 V10 L12 14 L20 40 Z" fill={HILL2} />
        <path d="M90 40 V16 L78 12 L72 40 Z" fill={HILL2} />
        <path d="M14 34 Q30 28 46 34 T78 34 V40 H14 Z" fill={LIGHT} opacity="0.45" />
        <path d="M26 33 Q32 30 38 33" stroke={SURFACE} strokeWidth="2" fill="none" opacity="0.7" />
      </>
    ),
  },
  mine: {
    width: 96,
    draw: (
      <>
        <rect x="40" y="12" width="5" height="24" fill={HILL2} />
        <rect x="70" y="12" width="5" height="24" fill={HILL2} />
        <rect x="36" y="9" width="43" height="5" fill={HILL2} />
        <rect x="0" y="35" width="96" height="5" fill={HILL} />
        {[4, 20, 36, 52, 68, 84].map((x) => (
          <rect key={x} x={x} y="32" width="8" height="3" fill={DARK} opacity="0.35" />
        ))}
      </>
    ),
  },
  embers: {
    width: 90,
    draw: (
      <>
        <path
          d="M0 40 V30 Q10 18 24 26 Q34 14 50 28 Q66 20 76 30 Q84 24 90 30 V40 Z"
          fill={HILL2}
        />
        <path
          d="M22 30 L26 36 M48 30 L44 37 M74 32 L78 37"
          stroke="var(--mantine-color-yellow-4)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </>
    ),
  },
  hell: {
    width: 56,
    draw: (
      <>
        <path
          d="M0 40 Q4 24 10 30 Q14 10 22 28 Q28 18 32 40 Z"
          fill="var(--mantine-color-orange-5)"
          opacity="0.85"
        />
        <path
          d="M30 40 Q34 26 40 32 Q44 16 50 30 Q54 24 56 40 Z"
          fill="var(--mantine-color-red-6)"
          opacity="0.8"
        />
        <path d="M8 40 Q10 30 14 34 Q18 24 22 40 Z" fill="var(--mantine-color-yellow-4)" />
        <rect x="0" y="37" width="56" height="3" fill={DARK} opacity="0.5" />
      </>
    ),
  },
  chimney: {
    width: 84,
    draw: (
      <>
        <path d="M0 40 V20 Q4 8 14 10 Q22 4 26 16 L28 40 Z" fill={HILL2} />
        <path d="M30 40 V30 Q36 22 44 28 Q50 24 52 34 V40 Z" fill={HILL} />
        <path d="M56 40 V14 Q62 2 72 8 Q82 10 84 22 V40 Z" fill={HILL2} />
        <path d="M10 16 L16 22 M66 12 L64 20" stroke={DARK} strokeWidth="1.5" opacity="0.35" />
        <rect x="0" y="37" width="84" height="3" fill={HILL} />
      </>
    ),
  },
  ridge: {
    width: 110,
    draw: (
      <>
        <path d="M0 40 V30 L18 16 L28 24 L50 4 L64 20 L80 12 L98 26 L110 30 V40 Z" fill={HILL} />
        <path d="M44 10 L50 4 L56 10 L52 12 L50 9 L48 12 Z" fill={SURFACE} opacity="0.9" />
        <path d="M0 40 V35 L30 28 L60 36 L90 30 L110 35 V40 Z" fill={HILL2} />
      </>
    ),
  },
  hut: {
    width: 120,
    draw: (
      <>
        <path d="M0 40 V28 L24 14 L44 26 L70 8 L96 24 L120 28 V40 Z" fill={HILL} />
        <path d="M64 13 L70 8 L76 13 L72 15 L70 12 L68 15 Z" fill={SURFACE} opacity="0.9" />
        <rect x="88" y="26" width="14" height="10" fill={HILL2} />
        <path d="M85 27 L95 20 L105 27 Z" fill={DARK} opacity="0.45" />
      </>
    ),
  },
};
