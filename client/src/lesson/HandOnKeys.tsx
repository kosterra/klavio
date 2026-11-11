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
const LONG: Finger[] = [2, 3, 4, 5];

type Pt = { x: number; y: number };
const add = (a: Pt, ...more: Pt[]): Pt =>
  more.reduce((p, q) => ({ x: p.x + q.x, y: p.y + q.y }), a);
const mul = (a: Pt, k: number): Pt => ({ x: a.x * k, y: a.y * k });
const norm = (a: Pt): Pt => {
  const l = Math.hypot(a.x, a.y) || 1;
  return { x: a.x / l, y: a.y / l };
};
const P = (p: Pt) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
const C = (c1: Pt, c2: Pt, p: Pt) => `C ${P(c1)} ${P(c2)} ${P(p)}`;

/* The hand in the proportions of a real one, measured in white keys (40):
 * fingers about 2½ keys long and ¾ of a key wide, the palm 3 keys from the
 * knuckles to the wrist, the wrist ¾ as wide as the knuckle row. */
/** how far up the key each fingertip reaches (the middle finger furthest) */
const REACH: Record<Finger, number> = { 1: 14, 2: 36, 3: 44, 4: 38, 5: 26 };
/** half the width of each finger at its base */
const HALF: Record<Finger, number> = { 1: 16, 2: 14.5, 3: 15, 4: 14, 5: 12 };
/** the knuckle row is an arc: the middle knuckle highest, the pinky's lowest */
const ARC: Record<Finger, number> = { 1: 0, 2: 6, 3: 0, 4: 4, 5: 10 };
const PALM = 120; // knuckles to wrist

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

  // s: the thumb's side (−1 left for the right hand, +1 right for the left)
  const s = shape.side === 'right' ? -1 : 1;
  const tip = (f: Finger): Pt => ({
    x: x(keyOf[f]),
    y: isBlack(keyOf[f]) ? BH - 20 : H - REACH[f],
  });
  // the knuckle row lies behind the fingertips; a finger on a black key is
  // stretched a little, but never beyond a real finger's length
  const row = LONG.reduce((n, f) => n + tip(f).y, 0) / 4 + 88;
  const centre = LONG.reduce((n, f) => n + tip(f).x, 0) / 4;
  const knuckle = (f: Finger): Pt => ({
    x: centre + (tip(f).x - centre) * 0.86,
    y: Math.min(Math.max(row + ARC[f], tip(f).y + 62), tip(f).y + 104),
  });
  const height = Math.max(...LONG.map((f) => knuckle(f).y)) + PALM + 10;
  const bottom = height + 12; // the wrist runs out of the picture

  // one finger: its axis u from knuckle to tip, nT the normal towards the thumb
  const finger = (f: Finger) => {
    const K = knuckle(f);
    const T = tip(f);
    const u = norm({ x: T.x - K.x, y: T.y - K.y });
    const nT = mul({ x: u.y, y: -u.x }, -s);
    const h = HALF[f];
    const cap = add(T, mul(u, -h * 0.15)); // centre of the rounded tip
    const len = Math.hypot(cap.x - K.x, cap.y - K.y);
    return {
      K,
      u,
      nT,
      h,
      len,
      cap,
      baseNear: add(K, mul(nT, h + 2)),
      baseFar: add(K, mul(nT, -(h + 2))),
    };
  };
  // one side of a finger from its base to the tip: broadest at the base,
  // a gentle bulge at the middle joint, a little slimmer before the tip
  const side = (f: Finger, sign: 1 | -1) => {
    const g = finger(f);
    const at = (along: number, out: number) => add(g.K, mul(g.u, along), mul(g.nT, sign * out));
    const joint = at(g.len * 0.5, g.h + 1.5);
    const end = at(g.len, g.h * 0.95);
    return {
      end,
      path: [
        C(at(g.len * 0.2, g.h + 2), at(g.len * 0.32, g.h + 2.5), joint),
        C(at(g.len * 0.66, g.h + 0.5), at(g.len * 0.84, g.h * 0.95), end),
      ].join(' '),
    };
  };
  // the outline of one finger: up the near side, round the tip, down the far
  const fingerOutline = (f: Finger) => {
    const g = finger(f);
    const near = side(f, 1);
    const far = side(f, -1);
    const k = g.h * 1.2;
    const back = `C ${P(add(far.end, mul(g.u, -g.len * 0.16), mul(g.nT, -(g.h * 0.95))))} ${P(add(far.end, mul(g.u, -g.len * 0.34), mul(g.nT, -(g.h + 0.5))))} ${P(add(g.K, mul(g.u, g.len * 0.5), mul(g.nT, -(g.h + 1.5))))} ${C(add(g.K, mul(g.u, g.len * 0.32), mul(g.nT, -(g.h + 2.5))), add(g.K, mul(g.u, g.len * 0.2), mul(g.nT, -(g.h + 2))), g.baseFar)}`;
    return [
      near.path,
      C(add(near.end, mul(g.u, k)), add(far.end, mul(g.u, k)), far.end),
      back,
    ].join(' ');
  };
  // the valley between two fingers dips a little into the back of the hand
  const valley = (a: Finger, b: Finger) => {
    const ga = finger(a);
    const gb = finger(b);
    return C(add(ga.baseFar, mul(ga.u, -7)), add(gb.baseNear, mul(gb.u, -7)), gb.baseNear);
  };

  // the thumb in two parts: from its root in the ball of the hand up to its
  // knuckle, then bent inward to its key – as a thumb looks from above
  const index = finger(2);
  const pinky = finger(5);
  const T1 = tip(1);
  // the thumb's knuckle sits right beside the index finger's base, and the
  // thumb leans outward from there to its key – shorter than the fingers
  const M1: Pt = { x: index.baseNear.x + s * 2, y: index.K.y - 2 };
  const palmWidth = Math.abs(pinky.baseFar.x - index.baseNear.x);
  const wristHalf = palmWidth * 0.38;
  const wristMid = (index.baseNear.x + pinky.baseFar.x) / 2 - s * 4;
  const WL: Pt = { x: wristMid + s * wristHalf, y: bottom };
  const WR: Pt = { x: wristMid - s * wristHalf, y: bottom };
  const R1: Pt = { x: WL.x + s * 6, y: bottom - 70 }; // the thumb's root
  const u0 = norm({ x: M1.x - R1.x, y: M1.y - R1.y });
  const u1 = norm({ x: T1.x - M1.x, y: T1.y - M1.y });
  const out0 = mul({ x: u0.y, y: -u0.x }, -s);
  const out1 = mul({ x: u1.y, y: -u1.x }, -s);
  const outM = norm(add(out0, out1));
  const h1 = HALF[1];
  const cap1 = add(T1, mul(u1, -h1 * 0.15));
  const len1 = Math.hypot(cap1.x - M1.x, cap1.y - M1.y);
  const R1o = add(R1, mul(out0, h1 + 1));
  const M1o = add(M1, mul(outM, h1 + 2));
  const TO = add(cap1, mul(out1, h1 * 0.85));
  const TI = add(cap1, mul(out1, -h1 * 0.85));
  // where the thumb's inner side runs into the web before the index finger
  const WB = add(index.baseNear, mul(index.u, -3));

  const hand = [
    `M ${P(WL)}`,
    // the ball of the thumb rises from the wrist into the thumb's outer side
    C({ x: WL.x + s * 10, y: WL.y - 60 }, add(R1o, mul(u0, -34), mul(out0, 6)), R1o),
    C(add(R1o, mul(u0, 30), mul(out0, 4)), add(M1o, mul(u0, -30), mul(out0, 3)), M1o),
    C(add(M1o, mul(u1, len1 * 0.3), mul(out1, 1)), add(TO, mul(u1, -len1 * 0.3), mul(out1, 1)), TO),
    C(add(TO, mul(u1, h1 * 1.1)), add(TI, mul(u1, h1 * 1.1)), TI),
    // down the thumb's inner side into the web before the index finger
    C(
      add(TI, mul(u1, -len1 * 0.4), mul(out1, -1)),
      add(WB, mul(u1, len1 * 0.25), mul(out1, -2)),
      WB,
    ),
    `L ${P(index.baseNear)}`,
    fingerOutline(2),
    valley(2, 3),
    fingerOutline(3),
    valley(3, 4),
    fingerOutline(4),
    valley(4, 5),
    fingerOutline(5),
    // the outer edge of the hand: a soft bulge below the pinky, then in to the wrist
    C(
      add(pinky.baseFar, mul(pinky.u, -38), mul(pinky.nT, -12)),
      { x: WR.x - s * 10, y: WR.y - 64 },
      WR,
    ),
    'Z',
  ].join(' ');

  // creases at the two joints of every finger, knuckle bumps on the back of
  // the hand, and the thumb's two joints
  const across = (p: Pt, along: Pt, half: number, dip = 3) =>
    `M ${P(add(p, mul({ x: along.y, y: -along.x }, half)))} Q ${P(add(p, mul(along, -dip)))} ${P(add(p, mul({ x: along.y, y: -along.x }, -half)))}`;
  const lines = LONG.flatMap((f) => {
    const g = finger(f);
    return [
      across(add(g.K, mul(g.u, g.len * 0.5)), g.u, g.h - 5),
      across(add(g.K, mul(g.u, g.len * 0.78)), g.u, g.h - 6, 2),
      across(add(g.K, mul(g.u, -7)), g.u, 7, -3),
    ];
  });
  lines.push(across(add(M1, mul(u1, len1 * 0.55)), u1, h1 - 6));

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

      {/* the hand is one shape: thumb, fingers and the back of the hand */}
      <path d={hand} className={classes.hand} />
      {lines.map((d, i) => (
        <path key={i} d={d} className={classes.crease} />
      ))}
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
