import type { CSSProperties, ReactNode } from 'react';
import type { KidsWorldId, WorldId } from './worlds';
import { JOURNEY_LANDMARKS } from './journeyArt';
import classes from './LearningPath.module.css';

/*
 * One big landmark per world, drawn comic-style (flat colours, dark outlines,
 * white highlights) – own artwork. Colours come from the section's
 * --chapter-* variables, so each world keeps its colour.
 */

const INK = 'var(--klavio-comic-line)';
const C = 'var(--chapter-color)';
const LIGHT = 'var(--chapter-light)';
const DARK = 'var(--chapter-dark)';
const GLOSS = 'rgb(255 255 255 / 55%)';
const line = { stroke: INK, strokeWidth: 3, strokeLinejoin: 'round' as const };

const Note = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill={INK}>
    <ellipse cx="0" cy="10" rx="5" ry="3.8" transform="rotate(-20 0 10)" />
    <rect x="3.2" y="-6" width="2.2" height="16" rx="1" />
    <path d="M5 -6 q7 2 6 9 q-2-4-6-4z" />
  </g>
);

const Ground = () => <path d="M4 126 Q90 100 176 126 Z" fill="var(--world-hill-2)" {...line} />;

const KIDS_LANDMARKS: Record<KidsWorldId, ReactNode> = {
  // Tasten-Tal: a castle with piano-key battlements
  keys: (
    <>
      <Ground />
      {/* towers */}
      <rect x="26" y="46" width="28" height="74" rx="3" fill={C} {...line} />
      <rect x="126" y="46" width="28" height="74" rx="3" fill={C} {...line} />
      <path d="M21 50 L40 14 L59 50 Z" fill="var(--mantine-color-orange-6)" {...line} />
      <path d="M121 50 L140 14 L159 50 Z" fill="var(--mantine-color-orange-6)" {...line} />
      <path
        d="M40 14 V2 L52 6 L40 10"
        fill="var(--mantine-color-yellow-5)"
        {...line}
        strokeWidth={2}
      />
      <path
        d="M140 14 V2 L152 6 L140 10"
        fill="var(--mantine-color-yellow-5)"
        {...line}
        strokeWidth={2}
      />
      <rect
        x="35"
        y="64"
        width="10"
        height="14"
        rx="5"
        fill="var(--mantine-color-yellow-3)"
        {...line}
        strokeWidth={2}
      />
      <rect
        x="135"
        y="64"
        width="10"
        height="14"
        rx="5"
        fill="var(--mantine-color-yellow-3)"
        {...line}
        strokeWidth={2}
      />
      {/* hall with a keyboard as battlements */}
      <rect x="52" y="58" width="76" height="62" fill={LIGHT} {...line} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <rect
          key={i}
          x={52 + i * 10.86}
          y="40"
          width="10.86"
          height="20"
          fill="#fff"
          {...line}
          strokeWidth={2}
        />
      ))}
      {[1, 2, 4, 5, 6].map((i) => (
        <rect key={i} x={52 + i * 10.86 - 3.5} y="40" width="7" height="12" rx="1" fill={INK} />
      ))}
      <path d="M78 120 V98 Q90 84 102 98 V120 Z" fill={DARK} {...line} />
      <rect x="58" y="66" width="22" height="4" rx="2" fill={GLOSS} />
      <rect x="30" y="52" width="4" height="22" rx="2" fill={GLOSS} />
    </>
  ),
  // Hand-Wald: a big tree with a tree house
  forest: (
    <>
      <Ground />
      <path d="M78 122 Q84 92 80 70 H102 Q98 94 106 122 Z" fill="#a8743f" {...line} />
      {[
        [56, 56, 28],
        [124, 58, 28],
        [90, 36, 36],
        [72, 74, 24],
        [110, 76, 24],
      ].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={i === 2 ? LIGHT : C} {...line} />
      ))}
      <circle cx="80" cy="24" r="10" fill={GLOSS} />
      {/* tree house */}
      <rect x="72" y="60" width="38" height="26" rx="3" fill="#f0c27a" {...line} />
      <path d="M66 62 L91 42 L116 62 Z" fill="var(--mantine-color-red-6)" {...line} />
      <rect x="84" y="68" width="12" height="18" rx="5" fill={DARK} {...line} strokeWidth={2} />
      <path d="M90 86 V118" stroke={INK} strokeWidth="2" strokeDasharray="4 4" />
      {/* mushrooms */}
      <path
        d="M20 118 Q20 104 32 104 Q44 104 44 118 Z"
        fill="var(--mantine-color-red-6)"
        {...line}
        strokeWidth={2.5}
      />
      <circle cx="28" cy="110" r="2.5" fill="#fff" />
      <circle cx="37" cy="112" r="2" fill="#fff" />
      <path
        d="M150 120 Q150 110 158 110 Q166 110 166 120 Z"
        fill="var(--mantine-color-red-6)"
        {...line}
        strokeWidth={2.5}
      />
    </>
  ),
  // Noten-Meer: lighthouse on a rock, a whale spouting notes
  sea: (
    <>
      <path d="M2 108 Q24 98 46 108 T90 108 T134 108 T178 108 V128 H2 Z" fill={LIGHT} {...line} />
      <path d="M36 114 Q66 86 104 114 Z" fill="var(--mantine-color-gray-5)" {...line} />
      <path d="M92 30 L156 14 L156 46 Z" fill="var(--mantine-color-yellow-3)" opacity="0.7" />
      <path d="M60 104 L66 36 H86 L92 104 Z" fill="#fff" {...line} />
      <path
        d="M62.3 78 L63.4 64 H88.6 L89.7 78 Z"
        fill="var(--mantine-color-red-6)"
        {...line}
        strokeWidth={2}
      />
      <path
        d="M64.6 52 L65.4 42 H86.6 L87.4 52 Z"
        fill="var(--mantine-color-red-6)"
        {...line}
        strokeWidth={2}
      />
      <rect
        x="63"
        y="22"
        width="26"
        height="15"
        rx="2"
        fill="var(--mantine-color-yellow-4)"
        {...line}
      />
      <path d="M58 23 L76 6 L94 23 Z" fill="var(--mantine-color-red-6)" {...line} />
      {/* whale */}
      <path
        d="M116 108 Q116 82 144 82 Q170 82 170 104 Q178 92 178 84 Q182 104 170 110 Z"
        fill={C}
        {...line}
      />
      <circle cx="132" cy="94" r="2.6" fill={INK} />
      <path
        d="M126 102 Q134 106 142 102"
        stroke={INK}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M140 82 Q138 70 134 64 M140 82 Q142 70 148 64"
        stroke={LIGHT}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <Note x={128} y={44} s={0.9} />
      <Note x={150} y={50} s={0.75} />
    </>
  ),
  // Lieder-Dorf: houses and a church tower with a bell
  village: (
    <>
      <Ground />
      <rect x="98" y="62" width="42" height="58" fill="#f6e7c8" {...line} />
      <rect x="106" y="32" width="26" height="34" fill="#f6e7c8" {...line} />
      <path d="M102 34 L119 4 L136 34 Z" fill={C} {...line} />
      <path
        d="M113 44 Q113 38 119 38 Q125 38 125 44 L127 52 H111 Z"
        fill="var(--mantine-color-yellow-5)"
        {...line}
        strokeWidth={2}
      />
      <path d="M110 120 V100 Q119 90 128 100 V120 Z" fill={DARK} {...line} />
      <rect x="26" y="80" width="42" height="40" fill={LIGHT} {...line} />
      <path d="M20 82 L47 56 L74 82 Z" fill="var(--mantine-color-red-6)" {...line} />
      <rect
        x="34"
        y="90"
        width="11"
        height="11"
        fill="var(--mantine-color-yellow-3)"
        {...line}
        strokeWidth={2}
      />
      <rect x="51" y="98" width="10" height="22" fill={DARK} {...line} strokeWidth={2} />
      <rect x="146" y="90" width="28" height="30" fill={C} {...line} />
      <path d="M142 92 L160 72 L178 92 Z" fill="var(--mantine-color-orange-6)" {...line} />
      <Note x={78} y={30} />
      <Note x={92} y={14} s={0.8} />
    </>
  ),
  // Rhythmus-Berg: a volcano with a drum on top, puffing notes
  mountain: (
    <>
      <path d="M118 124 L148 70 L178 124 Z" fill={LIGHT} {...line} />
      <path
        d="M140 84 L148 70 L156 84 L152 88 L148 82 L144 88 Z"
        fill="#fff"
        {...line}
        strokeWidth={2}
      />
      <path d="M8 124 L60 46 H108 L156 124 Z" fill={C} {...line} />
      <path
        d="M60 46 Q84 58 108 46 L102 58 Q84 66 66 58 Z"
        fill="var(--mantine-color-orange-5)"
        {...line}
        strokeWidth={2.5}
      />
      <path
        d="M66 58 Q60 80 70 96"
        stroke="var(--mantine-color-orange-5)"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      {/* drum */}
      <path d="M66 26 V44 Q84 52 102 44 V26 Z" fill="var(--mantine-color-red-6)" {...line} />
      <path d="M66 30 L75 44 L84 30 L93 46 L102 30" stroke="#fff" strokeWidth="2" fill="none" />
      <ellipse cx="84" cy="26" rx="18" ry="6" fill="#fff" {...line} />
      <path d="M70 6 L82 22 M100 4 L88 22" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
      <Note x={118} y={18} />
      <Note x={40} y={20} s={0.8} />
    </>
  ),
  // Bass-Höhle: a cave mouth with glowing crystals and a bat
  cave: (
    <>
      <path d="M6 126 Q10 40 90 30 Q170 40 174 126 Z" fill={C} {...line} />
      <path d="M40 126 Q44 70 90 64 Q136 70 140 126 Z" fill="#20172e" {...line} />
      <path
        d="M58 126 L66 96 L74 126 Z"
        fill="var(--mantine-color-yellow-3)"
        {...line}
        strokeWidth={2}
      />
      <path
        d="M100 126 L110 88 L120 126 Z"
        fill="var(--mantine-color-cyan-3)"
        {...line}
        strokeWidth={2}
      />
      <path d="M84 126 L89 108 L94 126 Z" fill={LIGHT} {...line} strokeWidth={2} />
      <path d="M70 66 L74 80 L78 66 Z M98 66 L102 82 L106 66 Z" fill={C} />
      <path
        d="M90 22 Q82 12 70 16 Q76 20 74 26 Q80 24 82 30 Q86 26 90 30 Q94 26 98 30 Q100 24 106 26 Q104 20 110 16 Q98 12 90 22 Z"
        fill={INK}
      />
      <circle cx="87" cy="23" r="1.6" fill="#fff" />
      <circle cx="93" cy="23" r="1.6" fill="#fff" />
      <path
        d="M30 60 Q40 48 52 50"
        stroke={GLOSS}
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
    </>
  ),
  // Brücken-Stadt: an arched bridge between two towers
  city: (
    <>
      <path
        d="M2 116 Q24 108 46 116 T90 116 T134 116 T178 116 V128 H2 Z"
        fill="var(--mantine-color-cyan-3)"
        {...line}
      />
      <rect x="14" y="40" width="30" height="86" rx="3" fill={LIGHT} {...line} />
      <rect x="136" y="40" width="30" height="86" rx="3" fill={LIGHT} {...line} />
      <path d="M10 42 L29 16 L48 42 Z" fill={DARK} {...line} />
      <path d="M132 42 L151 16 L170 42 Z" fill={DARK} {...line} />
      <path d="M44 74 H136 V88 Q113 66 90 88 Q67 66 44 88 Z" fill={C} {...line} />
      <path d="M44 74 Q90 40 136 74" stroke={INK} strokeWidth="3" fill="none" />
      <path
        d="M60 64 V74 M75 56 V74 M90 54 V74 M105 56 V74 M120 64 V74"
        stroke={INK}
        strokeWidth="2"
      />
      <rect
        x="23"
        y="56"
        width="12"
        height="16"
        rx="6"
        fill="var(--mantine-color-yellow-3)"
        {...line}
        strokeWidth={2}
      />
      <rect
        x="145"
        y="56"
        width="12"
        height="16"
        rx="6"
        fill="var(--mantine-color-yellow-3)"
        {...line}
        strokeWidth={2}
      />
      <rect x="18" y="46" width="4" height="22" rx="2" fill={GLOSS} />
    </>
  ),
  // Sternen-Nacht: an observatory under the moon
  night: (
    <>
      <Ground />
      <path
        d="M128 10 A18 18 0 1 0 150 40 A14 14 0 1 1 128 10 Z"
        fill="var(--mantine-color-yellow-4)"
        {...line}
      />
      <rect x="62" y="64" width="56" height="58" fill={C} {...line} />
      <path d="M56 66 Q90 18 124 66 Z" fill={LIGHT} {...line} />
      <path d="M84 30 L84 66 M84 30 L104 40" stroke={INK} strokeWidth="3" />
      <rect
        x="94"
        y="34"
        width="22"
        height="9"
        rx="3"
        fill={DARK}
        {...line}
        strokeWidth={2}
        transform="rotate(-25 105 38)"
      />
      <rect x="80" y="92" width="20" height="30" rx="8" fill={DARK} {...line} />
      <path
        d="M30 26 L32 31 L37 33 L32 35 L30 40 L28 35 L23 33 L28 31 Z"
        fill="var(--mantine-color-yellow-4)"
      />
      <path
        d="M44 8 L45.5 11.5 L49 13 L45.5 14.5 L44 18 L42.5 14.5 L39 13 L42.5 11.5 Z"
        fill="var(--mantine-color-yellow-4)"
      />
      <rect x="66" y="70" width="4" height="26" rx="2" fill={GLOSS} />
    </>
  ),
  // Takt-Zirkus: a striped big top with a pennant, the beat on its drum
  circus: (
    <>
      <Ground />
      <path d="M26 122 L38 64 H142 L154 122 Z" fill={LIGHT} {...line} />
      {[0, 1, 2, 3].map((i) => (
        <path
          key={i}
          d={`M${50 + i * 26} 64 L${44 + i * 30} 122 H${58 + i * 30} L${62 + i * 26} 64 Z`}
          fill={C}
        />
      ))}
      <path d="M26 122 L38 64 H142 L154 122 Z" fill="none" {...line} />
      <path d="M30 66 Q90 4 150 66 Z" fill={DARK} {...line} />
      <path
        d="M50 52 Q90 14 130 52"
        stroke="var(--mantine-color-yellow-4)"
        strokeWidth="5"
        fill="none"
      />
      <path d="M90 22 V6" stroke={INK} strokeWidth="3" />
      <path
        d="M90 6 L110 11 L90 17 Z"
        fill="var(--mantine-color-red-6)"
        {...line}
        strokeWidth={2}
      />
      <path d="M74 122 V96 Q90 80 106 96 V122 Z" fill="#fff" {...line} />
      <ellipse
        cx="90"
        cy="112"
        rx="11"
        ry="5"
        fill="var(--mantine-color-red-6)"
        {...line}
        strokeWidth={2}
      />
      <path
        d="M40 70 L48 70 L44 110"
        stroke={GLOSS}
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <Note x={150} y={22} s={1.1} />
    </>
  ),
  // Tonleiter-Wüste: a pyramid of steps – a scale in stone – under the sun
  desert: (
    <>
      <path
        d="M4 126 Q50 108 96 120 T176 118 V128 H4 Z"
        fill="var(--mantine-color-yellow-2)"
        {...line}
      />
      <circle cx="146" cy="28" r="16" fill="var(--mantine-color-yellow-4)" {...line} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect
          key={i}
          x={30 + i * 10}
          y={110 - i * 14}
          width={120 - i * 20}
          height="14"
          fill={i % 2 ? LIGHT : C}
          {...line}
          strokeWidth={2.5}
        />
      ))}
      <rect x="82" y="96" width="16" height="14" fill={DARK} {...line} strokeWidth={2} />
      <path d="M156 120 Q154 96 160 80" stroke={INK} strokeWidth="4" fill="none" />
      <path
        d="M160 80 q-16 -6 -24 4 M160 80 q14 -10 22 0 M160 80 q-6 -14 -18 -14 M160 80 q8 -14 18 -10"
        stroke="var(--mantine-color-green-7)"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <rect x="36" y="100" width="4" height="8" rx="2" fill={GLOSS} />
      <Note x={20} y={40} />
    </>
  ),
  // Konzert-Garten: a music pavilion among hedges and flowers
  garden: (
    <>
      <Ground />
      <path d="M40 118 H140 V124 H40 Z" fill={DARK} {...line} strokeWidth={2.5} />
      <rect x="46" y="104" width="88" height="14" rx="2" fill={LIGHT} {...line} />
      {[52, 76, 104, 128].map((x) => (
        <rect
          key={x}
          x={x - 3}
          y="56"
          width="6"
          height="48"
          fill="#fff"
          {...line}
          strokeWidth={2}
        />
      ))}
      <path d="M36 58 H144 L132 46 H48 Z" fill={C} {...line} />
      <path d="M48 46 Q90 2 132 46 Z" fill={LIGHT} {...line} />
      <path d="M90 14 V4" stroke={INK} strokeWidth="3" />
      <circle cx="90" cy="4" r="4" fill="var(--mantine-color-yellow-4)" {...line} strokeWidth={2} />
      <path
        d="M60 46 Q70 26 84 18"
        stroke={GLOSS}
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      {[
        [16, 116, 'pink'],
        [26, 120, 'yellow'],
        [154, 118, 'red'],
        [166, 114, 'grape'],
      ].map(([x, y, c]) => (
        <g key={`${x}`}>
          <path d={`M${x} ${y} v8`} stroke="var(--mantine-color-green-7)" strokeWidth="2.5" />
          <circle
            cx={x}
            cy={y}
            r="5"
            fill={`var(--mantine-color-${c}-4)`}
            {...line}
            strokeWidth={2}
          />
        </g>
      ))}
      <Note x={96} y={72} s={0.9} />
    </>
  ),
};

const LANDMARKS: Record<WorldId, ReactNode> = { ...KIDS_LANDMARKS, ...JOURNEY_LANDMARKS };

/** A world's landmark with a wooden name sign. */
export function Landmark({
  world,
  name,
  style,
  className,
}: {
  world: WorldId;
  name: string;
  style: CSSProperties;
  className?: string;
}) {
  return (
    <svg
      className={`${classes.landmark} ${className ?? ''}`}
      style={style}
      viewBox="0 0 180 150"
      width={176}
      height={147}
      aria-hidden
    >
      {LANDMARKS[world]}
      {/* name sign */}
      <g transform="rotate(-3 90 138)">
        <rect x="34" y="126" width="112" height="22" rx="5" fill="#f4d9a6" {...line} />
        <text
          x="90"
          y="137.5"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="12.5"
          fontWeight="900"
          fill={INK}
          fontFamily="inherit"
          letterSpacing="0.06em"
          // long names are squeezed to fit the sign
          textLength={name.length > 12 ? 100 : undefined}
          lengthAdjust="spacingAndGlyphs"
        >
          {name.toUpperCase()}
        </text>
      </g>
    </svg>
  );
}
