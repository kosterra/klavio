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
  const height = H + 186;
  const x = (midi: number) => (whiteIndex(midi) - first) * W + W / 2;
  const blacks = whites.flatMap((m) => (isBlack(m + 1) && m + 1 <= whites.at(-1)! ? [m + 1] : []));
  const used = new Set(Object.values(shape.keys));

  // fingertips on the keys, the hand comes from below (where the player sits).
  // Like a real hand: the middle finger reaches furthest, the little finger
  // and the thumb rest nearer the front edge; the knuckles form an arc.
  const REACH: Record<Finger, number> = { 1: 22, 2: 32, 3: 38, 4: 34, 5: 24 };
  const KNUCKLE: Record<Finger, number> = { 1: 0, 2: 50, 3: 45, 4: 50, 5: 60 };
  const WIDTH: Record<Finger, number> = { 1: 29, 2: 26, 3: 27, 4: 25, 5: 21 };
  const tip = (f: Finger) => ({
    x: x(keyOf[f]),
    y: isBlack(keyOf[f]) ? BH - 22 : H - REACH[f],
  });
  const long = [2, 3, 4, 5] as Finger[];
  const centre = long.reduce((n, f) => n + tip(f).x, 0) / 4;
  const base = (f: Finger) => ({
    x: centre + (tip(f).x - centre) * (f === 5 ? 0.74 : 0.84),
    y: H + KNUCKLE[f],
  });
  // s: the thumb's side (−1 left for the right hand, +1 right for the left)
  const s = shape.side === 'right' ? -1 : 1;
  // the palm's edges carry on the outer edges of the index and little finger
  // (the corners lie under the fingers, so finger and palm join without a step)
  const thumbTop = { x: base(2).x + s * (WIDTH[2] / 2 - 2), y: base(2).y + 10 };
  const pinkyTop = { x: base(5).x - s * (WIDTH[5] / 2 - 2), y: base(5).y + 10 };
  const wristY = H + 168;
  const wristHalf = Math.abs(pinkyTop.x - thumbTop.x) * 0.36;
  const wristMid = (thumbTop.x + pinkyTop.x) / 2 - s * 6;
  const wristThumb = wristMid + s * wristHalf;
  const wristPinky = wristMid - s * wristHalf;
  const knuckleTop = Math.min(...long.map((f) => base(f).y)) - 16;
  const palm = [
    `M ${thumbTop.x} ${thumbTop.y}`,
    // the ball of the thumb bulges out, then the palm narrows to the wrist
    `C ${thumbTop.x + s * 18} ${thumbTop.y + 52} ${wristThumb + s * 10} ${wristY - 46} ${wristThumb} ${wristY}`,
    `L ${wristPinky} ${wristY}`,
    `C ${wristPinky - s * 2} ${wristY - 44} ${pinkyTop.x - s * 6} ${pinkyTop.y + 46} ${pinkyTop.x} ${pinkyTop.y}`,
    `Q ${centre} ${knuckleTop} ${thumbTop.x} ${thumbTop.y}`,
    'Z',
  ].join(' ');
  // a finger: from its knuckle to the tip, gently curved; the thumb grows out
  // of the ball of the thumb low on the palm and bends towards its key
  const thumbBase = { x: thumbTop.x - s * 6, y: H + 96 };
  const fingerPath = (f: Finger) => {
    const t = tip(f);
    if (f === 1) {
      return `M ${thumbBase.x} ${thumbBase.y} Q ${(thumbBase.x + t.x) / 2 + s * 12} ${(thumbBase.y + t.y) / 2 + 8} ${t.x} ${t.y}`;
    }
    const b = base(f);
    return `M ${b.x} ${b.y} Q ${(b.x + t.x) / 2 + (b.x - centre) * 0.05} ${(b.y + t.y) / 2} ${t.x} ${t.y}`;
  };
  // a crease across each finger, a little below the middle joint
  const crease = (f: Finger) => {
    const t = tip(f);
    const b = f === 1 ? thumbBase : base(f);
    const k = f === 1 ? 0.45 : 0.5;
    const cx = t.x + (b.x - t.x) * k;
    const cy = t.y + (b.y - t.y) * k;
    const half = WIDTH[f] / 2 - 6;
    return `M ${cx - half} ${cy} Q ${cx} ${cy + 3} ${cx + half} ${cy}`;
  };

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

      {/* the hand: outlines first, then the palm, then the skin of the fingers */}
      {FINGERS.map((f) => (
        <path
          key={`line-${f}`}
          d={fingerPath(f)}
          strokeLinecap="round"
          strokeWidth={WIDTH[f] + 6}
          className={classes.outline}
        />
      ))}
      <path d={palm} strokeWidth={3} strokeLinejoin="round" className={classes.palm} />
      {FINGERS.map((f) => (
        <path
          key={`skin-${f}`}
          d={fingerPath(f)}
          strokeLinecap="round"
          strokeWidth={WIDTH[f]}
          className={classes.skin}
        />
      ))}
      {FINGERS.map((f) => (
        <path key={`crease-${f}`} d={crease(f)} className={classes.crease} />
      ))}
      <rect
        x={wristMid - wristHalf - 10}
        y={wristY - 8}
        width={wristHalf * 2 + 20}
        height={height - wristY + 10}
        rx={8}
        className={classes.sleeve}
      />
      {FINGERS.map((f) => {
        const p = tip(f);
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
