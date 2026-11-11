import { useTranslation } from 'react-i18next';
import { midiToPitchName, type HandShape } from '@klavio/shared';
import { useNoteLang } from './useLocalized';
import classes from './HandOnKeys.module.css';

const W = 40; // white key
const H = 150;
const BW = 24; // black key
const BH = 92;
const BLACK = new Set([1, 3, 6, 8, 10]);
const WHITE_PC = [0, 2, 4, 5, 7, 9, 11];

const isBlack = (midi: number) => BLACK.has(((midi % 12) + 12) % 12);
/** position counted in white keys (a black key sits between two) */
function whiteIndex(midi: number): number {
  const octave = Math.floor(midi / 12);
  const pc = midi % 12;
  const below = WHITE_PC.filter((p) => p <= pc).length - 1;
  return octave * 7 + below + (isBlack(midi) ? 0.5 : 0);
}
function whiteMidi(index: number): number {
  return Math.floor(index / 7) * 12 + WHITE_PC[((index % 7) + 7) % 7]!;
}

type Finger = 1 | 2 | 3 | 4 | 5;
const FINGERS: Finger[] = [1, 2, 3, 4, 5];

/*
 * The hand is a flat silhouette with spread fingers below the keys, as piano
 * books draw it, and an arrow leads from every fingertip to its key. Each
 * finger is a thick rounded line from its knuckle to its tip, the palm a
 * rounded shape bulging at the ball of the thumb; drawn first in the outline
 * colour a little broader, then in the skin colour, the parts melt into one
 * silhouette. Its coordinates are those of a right hand; the left hand is
 * the mirror image.
 */
const FINGER_LINES: Record<Finger, string> = {
  1: 'M 42 160 L -6 108',
  2: 'M 52 118 L 30 30',
  3: 'M 78 108 L 74 8',
  4: 'M 104 110 L 116 18',
  5: 'M 128 122 L 152 52',
};
/** the tips, where the numbers sit */
const TIPS: Record<Finger, [number, number]> = {
  1: [-6, 108],
  2: [30, 30],
  3: [74, 8],
  4: [116, 18],
  5: [152, 52],
};
/** the palm, bulging out at the ball of the thumb on its left side */
const PALM =
  'M 44 118 C 60 100 120 100 136 118 C 146 150 142 190 132 232 L 60 232 C 40 202 26 160 44 118 Z';
const SCALE = 0.85;
const TOP = 172; // where the hand starts below the keys
const HEIGHT = 375;

/**
 * «So liegt deine Hand»: the keys the lesson uses are marked, and a hand
 * below them shows with an arrow which finger plays which key.
 */
export function HandOnKeys({ shape }: { shape: HandShape }) {
  const { t } = useTranslation();
  const lang = useNoteLang();
  const dir = shape.side === 'right' ? 1 : -1;
  const known = FINGERS.filter((f) => shape.keys[f] !== undefined);
  const ref = known[0]!;
  // every finger gets a key: the lesson's, or the white key in line
  const keyOf = Object.fromEntries(
    FINGERS.map((f) => [
      f,
      shape.keys[f] ?? whiteMidi(Math.round(whiteIndex(shape.keys[ref]!)) + (f - ref) * dir),
    ]),
  ) as Record<Finger, number>;

  const idx = FINGERS.map((f) => whiteIndex(keyOf[f]));
  const first = Math.floor(Math.min(...idx)) - 1;
  const last = Math.ceil(Math.max(...idx)) + 1;
  const whites = Array.from({ length: last - first + 1 }, (_, i) => whiteMidi(first + i));
  const width = whites.length * W;
  const x = (midi: number) => (whiteIndex(midi) - first) * W + W / 2;
  const blacks = whites.flatMap((m) => (isBlack(m + 1) && m + 1 <= whites.at(-1)! ? [m + 1] : []));
  const used = new Set(Object.values(shape.keys));

  // the hand sits under the middle finger's key; the left hand is mirrored
  const mid = x(keyOf[3]);
  const place = ([lx, ly]: [number, number]) => ({
    x: mid + dir * (lx - TIPS[3][0]) * SCALE,
    y: TOP + ly * SCALE,
  });
  const transform = `translate(${mid - dir * TIPS[3][0] * SCALE} ${TOP}) scale(${dir * SCALE} ${SCALE})`;
  // an arrow from the fingertip to the foot of its key
  const arrow = (f: Finger) => {
    const from = place(TIPS[f]);
    const to = { x: x(keyOf[f]), y: (isBlack(keyOf[f]) ? BH : H) + 2 };
    const len = Math.hypot(to.x - from.x, to.y - from.y);
    const u = { x: (to.x - from.x) / len, y: (to.y - from.y) / len };
    const start = { x: from.x + u.x * 15, y: from.y + u.y * 15 };
    const base = { x: to.x - u.x * 13, y: to.y - u.y * 13 };
    const n = { x: -u.y * 6, y: u.x * 6 };
    return {
      line: `M ${start.x} ${start.y} L ${base.x} ${base.y}`,
      head: `M ${to.x} ${to.y} L ${base.x + n.x} ${base.y + n.y} L ${base.x - n.x} ${base.y - n.y} Z`,
    };
  };

  const label = t(shape.side === 'right' ? 'hand.right' : 'hand.left', {
    keys: known
      .map((f) => t('hand.finger', { n: f, note: midiToPitchName(shape.keys[f]!, lang) }))
      .join(', '),
  });

  return (
    <svg
      className={classes.svg}
      viewBox={`0 0 ${width} ${HEIGHT}`}
      role="img"
      aria-label={label}
      data-testid="hand-on-keys"
    >
      {whites.map((m, i) => (
        <rect
          key={m}
          x={i * W}
          y={0}
          width={W}
          height={H}
          rx={5}
          className={used.has(m) ? classes.usedWhite : classes.white}
        />
      ))}
      {blacks.map((m) => (
        <rect
          key={m}
          x={x(m) - BW / 2}
          y={0}
          width={BW}
          height={BH}
          rx={3}
          className={used.has(m) ? classes.usedBlack : classes.black}
        />
      ))}

      <g transform={transform}>
        <g className={classes.edge} strokeWidth={31}>
          {FINGERS.map((f) => (
            <path key={f} d={FINGER_LINES[f]} />
          ))}
        </g>
        <path className={classes.edge} strokeWidth={6} d={PALM} />
        <g className={classes.skin} strokeWidth={25}>
          {FINGERS.map((f) => (
            <path key={f} d={FINGER_LINES[f]} />
          ))}
        </g>
        <path className={classes.skin} d={PALM} />
      </g>

      {known.map((f) => {
        const a = arrow(f);
        return (
          <g key={f}>
            <path d={a.line} className={classes.arrow} />
            <path d={a.head} className={classes.arrowHead} />
          </g>
        );
      })}
      {FINGERS.map((f) => {
        const p = place(TIPS[f]);
        return (
          <g key={f} className={shape.keys[f] !== undefined ? classes.number : classes.numberIdle}>
            <circle cx={p.x} cy={p.y} r={13} />
            <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central">
              {f}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
