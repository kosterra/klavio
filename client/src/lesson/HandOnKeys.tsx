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
 * The hand is a drawing, not a construction: a right hand seen from above,
 * resting with its five fingers on five neighbouring white keys (thumb on
 * the left key), drawn in the proportions of a real hand – fingers about
 * three keys long, the palm running out of the picture at the wrist. Its
 * coordinates count from the left edge of the thumb's key; for the left hand
 * the drawing is mirrored. Lessons with another position (black keys) show
 * only the keys and the finger numbers.
 */
const ART_HEIGHT = 340;
/** one outline: up the ball of the thumb, round the thumb, up and down each finger, down the outer edge */
const OUTLINE = `M 48 350 C 36 322 26 290 34 258 C 30 236 20 200 8 160 C 2 148 2 132 12 128 C 24 124 34 130 36 142 C 40 160 44 180 44 194 C 44 204 46 208 47 206 C 45 182 44 150 46 124 C 46 112 52 110 60 110 C 68 110 74 112 74 124 C 75 150 75 190 72 212 C 72 222 80 226 86 214 C 85 180 85 145 86 116 C 86 104 92 100 100 100 C 108 100 114 104 114 116 C 115 145 115 185 113 214 C 113 224 120 228 126 216 C 125 186 125 150 126 124 C 126 112 132 108 140 108 C 148 108 154 112 154 124 C 155 150 155 190 153 216 C 153 228 160 232 166 222 C 165 198 165 168 167 142 C 167 128 173 118 180 118 C 187 118 193 128 193 142 C 195 170 198 196 202 224 C 210 250 212 290 204 318 C 200 332 196 342 192 350 Z`;
/** shade on the far side of every finger and along the outer edge of the hand */
const SHADES = [
  'M 34 258 C 30 236 20 200 8 160 L 17 156 C 28 196 36 232 42 254 Z',
  'M 74 124 C 75 150 75 190 72 212 L 65 212 C 68 190 68 150 67 124 Z',
  'M 114 116 C 115 145 115 185 113 214 L 106 214 C 108 185 108 145 107 116 Z',
  'M 154 124 C 155 150 155 190 153 216 L 146 216 C 148 190 148 150 147 124 Z',
  'M 193 142 C 195 170 198 196 202 224 C 210 250 212 290 204 318 L 194 318 C 202 290 200 250 192 224 C 188 196 186 170 185 142 Z',
];
/** knuckles, the middle joints of the fingers, the thumb's joint */
const LINES = [
  'M 48 230 Q 58 222 68 230',
  'M 90 224 Q 100 216 110 224',
  'M 130 228 Q 140 220 150 228',
  'M 171 240 Q 180 233 189 240',
  'M 50 168 Q 60 164 70 168 M 51 174 Q 60 170 69 174',
  'M 90 158 Q 100 154 110 158 M 91 164 Q 100 160 109 164',
  'M 130 164 Q 140 160 150 164 M 131 170 Q 140 166 149 170',
  'M 170 178 Q 180 174 190 178 M 171 184 Q 180 180 189 184',
  'M 16 180 Q 27 174 38 176 M 18 187 Q 28 181 39 183',
];
/** tendons up the back of the hand, and the fold where the thumb meets it */
const FAINT = [
  'M 84 330 C 78 300 70 270 60 244',
  'M 108 332 C 106 300 102 266 100 240',
  'M 134 332 C 136 300 139 268 140 244',
  'M 160 330 C 166 300 172 276 178 254',
  'M 47 206 C 44 232 44 260 52 290',
];
/** nails: x, y, width, height, and the thumb's turned a little */
const NAILS: [number, number, number, number, number][] = [
  [10, 130, 16, 11, -40],
  [51, 114, 18, 14, 0],
  [91, 104, 18, 14, 0],
  [131, 112, 18, 14, 0],
  [172, 122, 16, 12, 0],
];
/** where the finger numbers sit: on the pad of each finger, below the nail */
const NUMBER_Y: Record<Finger, number> = { 1: 146, 2: 136, 3: 126, 4: 134, 5: 142 };

/**
 * «So liegt deine Hand»: a drawn hand on the keys, seen from above, with the
 * finger numbers on the fingertips – the keys the lesson uses are marked.
 * Fingers the lesson doesn't use lie on the white keys beside the others.
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

  // the drawing fits when the five fingers lie on five neighbouring white keys
  const drawn = FINGERS.every(
    (f) => !isBlack(keyOf[f]) && whiteIndex(keyOf[f]) === whiteIndex(keyOf[1]) + (f - 1) * dir,
  );
  const height = drawn ? ART_HEIGHT : H + 20;
  // the drawing starts at the left edge of its leftmost key; the left hand is
  // mirrored about the middle finger's key
  const leftKey = x(keyOf[dir === 1 ? 1 : 5]) - W / 2;
  const transform =
    dir === 1
      ? `translate(${leftKey} 0)`
      : `translate(${2 * x(keyOf[3])} 0) scale(-1 1) translate(${leftKey} 0)`;
  const number = (f: Finger) => ({
    x: x(keyOf[f]),
    y: drawn ? NUMBER_Y[f] : isBlack(keyOf[f]) ? BH - 20 : H - 24,
  });

  const label = t(shape.side === 'right' ? 'hand.right' : 'hand.left', {
    keys: known
      .map((f) => t('hand.finger', { n: f, note: midiToPitchName(shape.keys[f]!, lang) }))
      .join(', '),
  });

  return (
    <svg
      className={classes.svg}
      viewBox={`0 0 ${width} ${height}`}
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

      {drawn && (
        <g transform={transform}>
          <path d={OUTLINE} className={classes.skin} />
          {SHADES.map((d) => (
            <path key={d} d={d} className={classes.shade} />
          ))}
          {LINES.map((d) => (
            <path key={d} d={d} className={classes.line} />
          ))}
          {FAINT.map((d) => (
            <path key={d} d={d} className={classes.faint} />
          ))}
          {NAILS.map(([nx, ny, w, h, turn]) => (
            <rect
              key={nx}
              x={nx}
              y={ny}
              width={w}
              height={h}
              rx={h / 2}
              transform={turn ? `rotate(${turn} ${nx + w / 2} ${ny + h / 2})` : undefined}
              className={classes.nail}
            />
          ))}
        </g>
      )}
      {FINGERS.map((f) => {
        const p = number(f);
        return (
          <g key={f} className={shape.keys[f] !== undefined ? classes.number : classes.numberIdle}>
            <circle cx={p.x} cy={p.y} r={12} />
            <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central">
              {f}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
