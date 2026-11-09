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
  const height = H + 120;
  const x = (midi: number) => (whiteIndex(midi) - first) * W + W / 2;
  const blacks = whites.flatMap((m) => (isBlack(m + 1) && m + 1 <= whites.at(-1)! ? [m + 1] : []));
  const used = new Set(Object.values(shape.keys));

  // fingertips on the keys, the hand comes from below (where the player sits)
  const tip = (f: Finger) => ({ x: x(keyOf[f]), y: isBlack(keyOf[f]) ? BH - 22 : H - 30 });
  const longs = ([2, 3, 4, 5] as Finger[]).map(tip);
  const centre = longs.reduce((n, p) => n + p.x, 0) / 4;
  const longBase = (f: Finger) => ({ x: centre + (tip(f).x - centre) * 0.82, y: H + 52 });
  const longBases = ([2, 3, 4, 5] as Finger[]).map(longBase);
  const palmL = Math.min(...longBases.map((b) => b.x)) - 20;
  const palmR = Math.max(...longBases.map((b) => b.x)) + 20;
  // the thumb grows out of the palm's side, lower down
  const bases = [{ x: shape.side === 'right' ? palmL + 16 : palmR - 16, y: H + 92 }, ...longBases];

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

      {/* the hand: palm, then the fingers, outline under skin */}
      <rect
        x={palmL}
        y={H + 40}
        width={palmR - palmL}
        height={120}
        rx={34}
        className={classes.palmLine}
      />
      {[true, false].map((outline) =>
        FINGERS.map((f) => (
          <line
            key={`${outline}-${f}`}
            x1={bases[f - 1]!.x}
            y1={bases[f - 1]!.y}
            x2={tip(f).x}
            y2={tip(f).y}
            strokeLinecap="round"
            strokeWidth={outline ? 31 : 25}
            className={outline ? classes.outline : classes.skin}
          />
        )),
      )}
      <rect
        x={palmL + 3}
        y={H + 43}
        width={palmR - palmL - 6}
        height={120}
        rx={31}
        className={classes.palm}
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
