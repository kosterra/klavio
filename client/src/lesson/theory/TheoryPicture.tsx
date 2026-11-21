import { Box, Text } from '@mantine/core';
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react';
import { useMediaQuery } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import {
  isBlackKey,
  midiToName,
  midiToPitchName,
  parseSong,
  type TheoryPicture as Picture,
  spellingOf,
  staffDuration,
} from '@klavio/shared';
import { PianoKeyboard } from '../../components/PianoKeyboard';
import { Staff } from '../../notation/Staff';
import { GrandStaff } from '../../notation/GrandStaff';
import { Sticker } from '../Stickers';
import type { StickerKind } from '../stickerKinds';
import { NoteValues } from './NoteValues';
import classes from './Theory.module.css';

/** Horizontal centre of a key in % of the keyboard width (same maths as PianoKeyboard). */
function keyCenter(midi: number, from: number, to: number): number {
  const whites: number[] = [];
  for (let m = from; m <= to; m++) if (!isBlackKey(m)) whites.push(m);
  const w = 100 / whites.length;
  if (isBlackKey(midi)) return (whites.indexOf(midi - 1) + 1) * w;
  return (whites.indexOf(midi) + 0.5) * w;
}

/** The groups of two and three black keys: neighbours are two semitones apart. */
function blackGroups(from: number, to: number): number[][] {
  const groups: number[][] = [];
  for (let m = from; m <= to; m++) {
    if (!isBlackKey(m)) continue;
    const last = groups[groups.length - 1];
    if (last && last[last.length - 1] === m - 2) last.push(m);
    else groups.push([m]);
  }
  return groups;
}

function KeyboardPicture({
  p,
  height,
}: {
  p: Extract<Picture, { kind: 'keyboard' }>;
  height: number;
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('de') ? 'de' : 'en';
  const at = (m: number) => `${keyCenter(m, p.from, p.to)}%`;
  const marks = p.marks ?? [];
  return (
    <Box
      className={classes.keyboardPicture}
      role="img"
      aria-label={
        marks.length
          ? t('theory.keyboardMarked', { notes: marks.map((m) => midiToName(m, lang)).join(', ') })
          : t('theory.keyboardPicture')
      }
    >
      {p.groups && (
        <div className={classes.overlayRow} aria-hidden>
          {blackGroups(p.from, p.to).map((g) => {
            const left = keyCenter(g[0]!, p.from, p.to);
            const right = keyCenter(g[g.length - 1]!, p.from, p.to);
            return (
              <span
                key={g[0]}
                className={classes.group}
                data-size={g.length}
                style={{ left: `calc(${left}% - 14px)`, width: `calc(${right - left}% + 28px)` }}
              >
                {g.length}
              </span>
            );
          })}
        </div>
      )}
      {p.fingering && (
        <div className={classes.overlayRow} aria-hidden>
          {p.fingering.map(([m, f]) => (
            <span key={m} className={classes.finger} style={{ left: at(m) }}>
              {f}
            </span>
          ))}
        </div>
      )}
      <div aria-hidden>
        <PianoKeyboard
          from={p.from}
          to={p.to}
          labels={p.labels ?? 'none'}
          hints={marks}
          height={height}
        />
      </div>
      {p.direction && (
        <div className={classes.direction} aria-hidden>
          <Text fw={800} c="dimmed" className={classes.directionItem}>
            <IconArrowLeft size={20} /> {t('theory.lower')}
          </Text>
          <Text fw={800} c="dimmed" className={classes.directionItem}>
            {t('theory.higher')} <IconArrowRight size={20} />
          </Text>
        </div>
      )}
    </Box>
  );
}

/**
 * A hand seen from above with finger numbers 1–5 – own drawing. The right hand
 * has its thumb on the left; the left hand is the mirror image.
 */
export function HandPicture({
  highlight,
  numbers = true,
  side = 'right',
}: {
  highlight?: number;
  numbers?: boolean;
  side?: 'left' | 'right';
}) {
  const left = side === 'left';
  // mirror the shapes for the left hand; the numbers stay readable
  const mx = (x: number) => (left ? 200 - x : x);
  const { t } = useTranslation();
  // finger 1 = thumb … 5 = little finger: [base, tip]
  const fingers: [number, number, number, number][] = [
    [80, 150, 34, 104],
    [78, 112, 78, 46],
    [104, 108, 104, 30],
    [130, 110, 130, 40],
    [154, 118, 156, 64],
  ];
  return (
    <svg
      className={classes.hand}
      viewBox="0 0 200 200"
      role="img"
      aria-label={
        left
          ? numbers
            ? t('theory.handNumbersLeft')
            : t('theory.handMarkedLeft')
          : numbers
            ? t('theory.handNumbers')
            : t('theory.handMarked')
      }
    >
      <g transform={left ? 'translate(200 0) scale(-1 1)' : undefined}>
        {/* outline, then skin */}
        {[true, false].map((outline) =>
          fingers.map(([x1, y1, x2, y2], i) => (
            <line
              key={`${outline}-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              strokeLinecap="round"
              strokeWidth={outline ? 30 : 25}
              stroke={
                outline
                  ? 'var(--klavio-hand-line)'
                  : highlight === i + 1
                    ? 'var(--mantine-color-orange-4)'
                    : 'var(--klavio-hand)'
              }
            />
          )),
        )}
        <rect
          x="62"
          y="98"
          width="110"
          height="88"
          rx="40"
          fill="var(--klavio-hand)"
          stroke="var(--klavio-hand-line)"
          strokeWidth="2.5"
        />
        {/* cover the finger bases so palm and fingers join */}
        <rect x="66" y="100" width="102" height="30" rx="14" fill="var(--klavio-hand)" />
      </g>
      {fingers.map(([, , fx, y], i) => {
        const x = mx(fx);
        const show = numbers || highlight === i + 1;
        if (!show) return null;
        return (
          <g key={i}>
            <circle
              cx={x}
              cy={y + 2}
              r="11"
              fill="var(--klavio-surface)"
              stroke="var(--klavio-hand-line)"
              strokeWidth="1.5"
            />
            <text
              x={x}
              y={y + 2}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="14"
              fontWeight="800"
              fill="var(--mantine-color-text)"
              fontFamily="inherit"
            >
              {numbers ? i + 1 : '?'}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Diatonic step of a white key (C4 = 28), for placing notes on the staff. */
function diatonic(midi: number): number {
  const steps = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];
  return Math.floor(midi / 12) * 7 + steps[midi % 12]!;
}

/**
 * A plain staff diagram (own drawing): colours its lines or its spaces, one
 * place of it, or numbers the lines or spaces from the bottom – to explain
 * "on a line" vs. "in a space" and how they are counted. Treble clef positions.
 */
function StaffDiagram({
  notes,
  highlight,
  numbers,
  mark,
}: {
  notes: number[];
  highlight?: 'lines' | 'spaces';
  numbers?: 'lines' | 'spaces';
  mark?: number;
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('de') ? 'de' : 'en';
  const gap = 16;
  const bottom = 100; // y of the lowest line (E4)
  const lines = [0, 1, 2, 3, 4].map((i) => bottom - i * gap);
  const yOf = (m: number) => bottom - ((diatonic(m) - diatonic(64)) * gap) / 2;
  // without notes (counting lines and spaces): a short staff, drawn bigger
  const width = notes.length ? 360 : 220;
  // room on the left for the numbers
  const left = numbers ? 44 : 10;
  const step = (width - left - 50) / Math.max(1, notes.length);
  const accent = 'var(--mantine-color-orange-6)';
  const marksLine = mark !== undefined && mark % 2 === 0;
  const names = notes.map((m) => midiToName(m, lang)).join(', ');
  const label =
    mark !== undefined
      ? t(marksLine ? 'theory.staffMarkLine' : 'theory.staffMarkSpace', {
          n: Math.floor(mark / 2) + 1,
        })
      : numbers
        ? t(numbers === 'lines' ? 'theory.staffNumberLines' : 'theory.staffNumberSpaces')
        : t(highlight === 'spaces' ? 'theory.staffSpaces' : 'theory.staffLines', {
            notes: names,
          });
  return (
    <svg
      viewBox={notes.length ? `0 0 ${width} 130` : `0 24 ${width} 92`}
      className={classes.staffDiagram}
      style={notes.length ? undefined : { maxWidth: 340 }}
      role="img"
      aria-label={label}
      data-testid="staff-diagram"
    >
      {highlight === 'spaces' &&
        lines
          .slice(0, 4)
          .map((y) => (
            <rect
              key={y}
              x={left}
              y={y - gap + 2}
              width={width - left - 10}
              height={gap - 4}
              rx="3"
              fill="var(--mantine-color-orange-2)"
            />
          ))}
      {mark !== undefined && !marksLine && (
        <rect
          x={left}
          y={bottom - ((mark + 1) * gap) / 2 + 2}
          width={width - left - 10}
          height={gap - 4}
          rx="3"
          fill="var(--mantine-color-orange-3)"
        />
      )}
      {lines.map((y, i) => {
        const strong = highlight === 'lines' || (marksLine && mark === i * 2);
        return (
          <line
            key={y}
            x1={left}
            x2={width - 10}
            y1={y}
            y2={y}
            stroke={strong ? accent : 'var(--klavio-ink)'}
            strokeWidth={strong ? 4 : 1.5}
            strokeLinecap="round"
          />
        );
      })}
      {numbers &&
        (numbers === 'lines' ? lines : lines.slice(0, 4).map((y) => y - gap / 2)).map((y, i) => (
          <text
            key={y}
            x={left - 12}
            y={y + 5}
            textAnchor="middle"
            fontSize="14"
            fontWeight="800"
            fill="var(--klavio-ink)"
          >
            {i + 1}
          </text>
        ))}
      {notes.map((m, i) => {
        const x = left + 40 + i * step + step / 2;
        const y = yOf(m);
        return (
          <g key={i}>
            {y > bottom + gap / 2 - 1 && (
              <line
                x1={x - 18}
                x2={x + 18}
                y1={bottom + gap}
                y2={bottom + gap}
                stroke="var(--klavio-ink)"
                strokeWidth="1.5"
              />
            )}
            <ellipse
              cx={x}
              cy={y}
              rx="10"
              ry="7.5"
              transform={`rotate(-20 ${x} ${y})`}
              fill="var(--klavio-ink)"
            />
          </g>
        );
      })}
    </svg>
  );
}

/** Draws a theory picture from its description. */
export function TheoryPicture({ picture, kids }: { picture: Picture; kids: boolean }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('de') ? 'de' : 'en';
  // phones: a lower staff, so the explanation, picture and buttons fit on one screen
  const narrow = useMediaQuery('(max-width: 36em)') ?? false;
  const staffH = narrow ? 120 : kids ? 170 : 150;
  switch (picture.kind) {
    case 'keyboard':
      return <KeyboardPicture p={picture} height={kids ? 150 : 120} />;
    case 'hand':
      return (
        <HandPicture highlight={picture.highlight} numbers={picture.numbers} side={picture.side} />
      );
    case 'grand-staff':
      return (
        <Box className={classes.staffPicture}>
          <GrandStaff
            bars={[
              {
                rh: picture.notes
                  .filter((m) => m >= 60)
                  .map((m) => ({
                    midi: m,
                    label: picture.names ? midiToPitchName(m, lang) : undefined,
                  })),
                lh: picture.notes
                  .filter((m) => m < 60)
                  .map((m) => ({
                    midi: m,
                    label: picture.names ? midiToPitchName(m, lang) : undefined,
                  })),
              },
            ]}
            height={kids ? 260 : 230}
            label={picture.notes.map((m) => midiToName(m, lang)).join(', ')}
          />
        </Box>
      );
    case 'sticker':
      return (
        <div className={classes.sticker} aria-hidden>
          <Sticker kind={picture.sticker as StickerKind} size={110} style={{ left: 0, top: 0 }} />
        </div>
      );
    case 'staff':
      if (picture.highlight || picture.numbers || picture.mark !== undefined) {
        return (
          <StaffDiagram
            notes={picture.notes}
            highlight={picture.highlight}
            numbers={picture.numbers}
            mark={picture.mark}
          />
        );
      }
      return (
        <Box className={classes.staffPicture} data-highlight={picture.highlight}>
          <Staff
            clef={picture.clef}
            keySignature={picture.keySignature}
            spelling={picture.spelling}
            notes={picture.notes.map((m) => ({
              midi: m,
              duration: 'q',
              label: picture.names
                ? midiToPitchName(
                    m,
                    lang,
                    picture.spelling ?? spellingOf(picture.keySignature ?? 'C'),
                  )
                : undefined,
            }))}
            // room below the staff for the note names
            height={staffH + (picture.names ? (narrow ? 30 : 40) : 0)}
            label={picture.notes.map((m) => midiToName(m, lang)).join(', ')}
          />
        </Box>
      );
    case 'music': {
      const bars = parseSong(picture.melody, picture.time ?? '4/4');
      return (
        <Box className={classes.staffPicture}>
          <Staff
            clef={picture.clef}
            time={picture.time}
            bars={bars.map((bar) =>
              bar.map((n) => ({ midi: n.midi, duration: staffDuration(n), tie: n.tie })),
            )}
            height={staffH}
            label={t('theory.musicBars', {
              count: bars.length,
              notes: bars
                .flat()
                .filter((n) => !n.rest)
                .map((n) => midiToName(n.midi, lang))
                .join(', '),
            })}
          />
        </Box>
      );
    }
    case 'note-values':
      return <NoteValues values={picture.values} pizza={picture.pizza} />;
  }
}
