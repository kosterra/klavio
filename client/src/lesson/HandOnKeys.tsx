import { useId } from 'react';
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

/**
 * «So liegt deine Hand»: a drawn hand on the keys, seen from above, with the
 * finger numbers on the fingertips – the keys the lesson uses are marked.
 * Fingers the lesson doesn't use lie on the white keys beside the others.
 */
export function HandOnKeys({ shape }: { shape: HandShape }) {
  const { t } = useTranslation();
  const maskId = `hand-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
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
  const height = H + 130;
  const x = (midi: number) => (whiteIndex(midi) - first) * W + W / 2;
  const blacks = whites.flatMap((m) => (isBlack(m + 1) && m + 1 <= whites.at(-1)! ? [m + 1] : []));
  const used = new Set(Object.values(shape.keys));

  // The hand as it rests on the keys, seen from above: the fingers are curled,
  // so they look short and plump, their tips on the front part of the keys;
  // the knuckles sit just behind the keys; the back of the hand is a wide,
  // soft shape that narrows towards the wrist, which runs out of the picture;
  // the thumb lies on its side, pointing inward to its key, and grows out of
  // the ball of the hand.
  // s: the thumb's side (−1 left for the right hand, +1 right for the left)
  const s = shape.side === 'right' ? -1 : 1;
  const REACH: Record<Finger, number> = { 1: 24, 2: 30, 3: 34, 4: 30, 5: 22 };
  const tip = (f: Finger): Pt => ({
    x: x(keyOf[f]),
    y: isBlack(keyOf[f]) ? BH - 20 : H - REACH[f],
  });
  const long = [2, 3, 4, 5] as Finger[];
  // half the width of a finger at the tip (the base is a little broader)
  const HALF: Record<Finger, number> = { 1: 16, 2: 15, 3: 15.5, 4: 15, 5: 13 };
  // how far behind the fingertips the knuckle row lies
  const LEN: Record<Finger, number> = { 1: 0, 2: 46, 3: 44, 4: 46, 5: 52 };
  const y0 = (tip(2).y + tip(3).y + tip(4).y) / 3;
  const centre = long.reduce((n, f) => n + tip(f).x, 0) / 4;
  const knuckle = (f: Finger): Pt => ({
    x: centre + (tip(f).x - centre) * 0.9,
    y: Math.max(y0 + LEN[f], tip(f).y + 34),
  });
  // one finger: its axis u from knuckle to tip, nT the normal towards the thumb
  const finger = (f: Finger) => {
    const K = knuckle(f);
    const T = tip(f);
    const u = norm({ x: T.x - K.x, y: T.y - K.y });
    const nT = mul({ x: u.y, y: -u.x }, -s);
    const h = HALF[f];
    const cap = add(T, mul(u, -1)); // centre of the rounded tip
    const len = Math.hypot(cap.x - K.x, cap.y - K.y);
    return {
      K,
      u,
      nT,
      h,
      len,
      baseNear: add(K, mul(nT, h + 1.5)),
      baseFar: add(K, mul(nT, -(h + 1.5))),
      capNear: add(cap, mul(nT, h)),
      capFar: add(cap, mul(nT, -h)),
      cap,
    };
  };
  // the outline of one finger from its near base over the tip to its far
  // base: sides bulging a little at the middle joint, a round tip
  const fingerOutline = (f: Finger) => {
    const g = finger(f);
    const k = g.h * 1.25;
    return [
      C(
        add(g.baseNear, mul(g.u, g.len * 0.35), mul(g.nT, 1.5)),
        add(g.capNear, mul(g.u, -g.len * 0.3), mul(g.nT, 2.5)),
        g.capNear,
      ),
      C(add(g.capNear, mul(g.u, k)), add(g.capFar, mul(g.u, k)), g.capFar),
      C(
        add(g.capFar, mul(g.u, -g.len * 0.3), mul(g.nT, -2.5)),
        add(g.baseFar, mul(g.u, g.len * 0.35), mul(g.nT, -1.5)),
        g.baseFar,
      ),
    ].join(' ');
  };
  // the valley between two fingers
  const valley = (a: Finger, b: Finger) => {
    const ga = finger(a);
    const gb = finger(b);
    return C(add(ga.baseFar, mul(ga.u, -7)), add(gb.baseNear, mul(gb.u, -7)), gb.baseNear);
  };

  // the thumb: it points inward to its key at an angle, its root lies in the
  // ball of the hand beside the index finger
  const T1 = tip(1);
  const index = finger(2);
  const u1 = norm({ x: -s * 0.42, y: -0.91 });
  const nOut = mul({ x: u1.y, y: -u1.x }, -s);
  const nIn = mul(nOut, -1);
  const h1 = HALF[1];
  const rootX = s * Math.max(s * (T1.x + s * 21), s * (index.baseNear.x + s * 22));
  const R1: Pt = { x: rootX, y: Math.max(T1.y + 52, index.K.y + 14) };
  const cap1 = add(T1, mul(u1, -1));
  const OB = add(R1, mul(nOut, h1)); // where the thumb grows out of the ball
  const IB = add(R1, mul(nIn, h1)); // where the thumb meets the web
  const TO = add(cap1, mul(nOut, h1));
  const TI = add(cap1, mul(nIn, h1));
  const len1 = Math.hypot(cap1.x - R1.x, cap1.y - R1.y);
  const thumbEdge = [
    `M ${P(OB)}`,
    C(add(OB, mul(u1, len1 * 0.3), mul(nOut, 5)), add(TO, mul(u1, -len1 * 0.35), mul(nOut, 4)), TO),
    C(add(TO, mul(u1, h1 * 1.25)), add(TI, mul(u1, h1 * 1.25)), TI),
    C(add(TI, mul(u1, -len1 * 0.35), mul(nIn, 1)), add(IB, mul(u1, len1 * 0.3), mul(nIn, 1)), IB),
  ].join(' ');
  // the thumb's root reaches under the hand, just inside the thumb's edges
  const P1 = add(IB, mul(u1, -2), mul(nOut, 3));
  const P2 = add(OB, mul(u1, -2), mul(nIn, 3));
  const thumbFill = `${thumbEdge} L ${P(P1)} ${C(add(P1, mul(u1, -18)), add(P2, mul(u1, -18)), P2)} Z`;

  const pinky = finger(5);
  const bottom = height + 12; // the wrist runs out of the picture
  const palmWidth = Math.abs(pinky.baseFar.x - OB.x);
  const wristHalf = palmWidth * 0.3;
  const wristMid = finger(3).K.x + s * 6;
  const WR: Pt = { x: wristMid - s * wristHalf, y: bottom };
  const WL: Pt = { x: wristMid + s * wristHalf, y: bottom };
  // the web between thumb and index finger
  const web = `M ${P(IB)} ${C(add(IB, mul(u1, -8)), add(index.baseNear, { x: 0, y: 14 }), index.baseNear)}`;
  // from the index finger around the fingers, down the outer side to the
  // wrist and up the ball of the thumb
  const handEdge = [
    fingerOutline(2),
    valley(2, 3),
    fingerOutline(3),
    valley(3, 4),
    fingerOutline(4),
    valley(4, 5),
    fingerOutline(5),
    // the outer edge of the hand, slightly bulging, down to the wrist
    C(
      add(pinky.baseFar, mul(pinky.u, -40), mul(pinky.nT, -12)),
      { x: WR.x - s * 16, y: WR.y - 55 },
      WR,
    ),
    `L ${P(WL)}`,
    // the ball of the thumb, rising into the thumb's outer edge
    C({ x: WL.x + s * 18, y: WL.y - 52 }, add(OB, mul(u1, -36)), OB),
  ].join(' ');

  // creases at the middle joints and the knuckle bumps on the back of the hand
  const crease = (f: Finger) => {
    const g = finger(f);
    const j = add(g.cap, mul(g.u, -g.len * 0.42));
    const half = g.h - 6;
    return `M ${P(add(j, mul(g.nT, half)))} Q ${P(add(j, mul(g.u, -3)))} ${P(add(j, mul(g.nT, -half)))}`;
  };
  const knuckleBump = (f: Finger) => {
    const g = finger(f);
    const b = add(g.K, mul(g.u, -9));
    return `M ${P(add(b, mul(g.nT, 7)))} Q ${P(add(g.K, mul(g.u, -3)))} ${P(add(b, mul(g.nT, -7)))}`;
  };
  const thumbCrease = (() => {
    const j = add(cap1, mul(u1, -22));
    const half = h1 - 5;
    return `M ${P(add(j, mul(nOut, half)))} Q ${P(add(j, mul(u1, -3)))} ${P(add(j, mul(nIn, half)))}`;
  })();

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

      {/* layers, from below: the back of the hand with its web, the thumb
          lying on it, the fingers curling over it; each outline is drawn only
          where it shows, so they join into one continuous line */}
      <mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={width} height={height}>
        <rect x={0} y={0} width={width} height={height} fill="#fff" />
        {long.map((f) => (
          <path key={f} d={`M ${P(finger(f).baseNear)} ${fingerOutline(f)} Z`} fill="#000" />
        ))}
      </mask>
      <path d={`${web} ${handEdge} Z`} className={classes.hand} />
      <path d={web} className={classes.handLine} />
      <path d={thumbFill} className={classes.hand} />
      <path d={thumbEdge} className={classes.handLine} mask={`url(#${maskId})`} />
      <path d={`M ${P(index.baseNear)} ${handEdge}`} className={classes.handLine} />
      <path d={thumbCrease} className={classes.crease} />
      {long.map((f) => (
        <g key={`lines-${f}`}>
          <path d={crease(f)} className={classes.crease} />
          <path d={knuckleBump(f)} className={classes.crease} />
        </g>
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
