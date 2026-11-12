import { Stack, Text } from '@mantine/core';
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
 * «So liegt deine Hand»: the keys the lesson uses, each with the number of
 * the finger that plays it and its name – the way piano books show a hand
 * position – and below, in words, which hand it is and where each finger
 * goes. Fingers the lesson doesn't use get the white key in line, in grey.
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
  const name = (midi: number) => midiToPitchName(midi, lang).replace(/-?\d+$/, '');

  const caption = t(shape.side === 'right' ? 'hand.right' : 'hand.left', {
    keys: known
      .map((f) => t('hand.finger', { n: f, note: midiToPitchName(shape.keys[f]!, lang) }))
      .join(', '),
  });

  return (
    <Stack gap={6} align="center" w="100%" data-testid="hand-on-keys">
      <svg className={classes.svg} viewBox={`0 0 ${width} ${H + 4}`} aria-hidden>
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
        {FINGERS.map((f) => {
          const midi = keyOf[f];
          const black = isBlack(midi);
          const cx = x(midi);
          const cy = black ? BH - 22 : H - 20;
          return (
            <g
              key={f}
              className={shape.keys[f] !== undefined ? classes.number : classes.numberIdle}
            >
              {!black && (
                <text x={cx} y={BH + 16} textAnchor="middle" className={classes.keyName}>
                  {name(midi)}
                </text>
              )}
              <circle cx={cx} cy={cy} r={13} />
              <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
                {f}
              </text>
            </g>
          );
        })}
      </svg>
      <Text size="sm" ta="center" data-testid="hand-caption">
        {caption}
      </Text>
    </Stack>
  );
}
