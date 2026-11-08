import { Group, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { Staff } from '../../notation/Staff';
import type { RhythmValue } from '@klavio/shared';
import classes from './Theory.module.css';

type Value = 'w' | 'h' | 'q' | 'qr';

const SHARE: Record<Value, number> = { w: 1, h: 0.5, q: 0.25, qr: 0 };
const BEATS: Record<Value, number> = { w: 4, h: 2, q: 1, qr: 1 };

/** A note symbol, drawn simply (head, stem, hollow or filled). */
export function NoteSymbol({ value }: { value: Value }) {
  if (value === 'qr') {
    return (
      <svg viewBox="0 0 40 60" className={classes.noteSymbol} aria-hidden>
        <path
          d="M17 8 L25 20 L18 30 L26 42 Q16 38 18 50 Q8 40 20 36 L13 26 L20 18 Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  const hollow = value !== 'q';
  return (
    <svg viewBox="0 0 40 60" className={classes.noteSymbol} aria-hidden>
      <ellipse
        cx="18"
        cy="46"
        rx="10"
        ry="7"
        transform="rotate(-20 18 46)"
        fill={hollow ? 'none' : 'currentColor'}
        stroke="currentColor"
        strokeWidth={hollow ? 3.5 : 0}
      />
      {value !== 'w' && <rect x="25.5" y="6" width="3" height="40" rx="1.5" fill="currentColor" />}
    </svg>
  );
}

/** A pizza with the note's share of a whole bar (rest = empty plate). */
function Pizza({ share }: { share: number }) {
  const r = 26;
  const end = share * 2 * Math.PI;
  const x = 30 + r * Math.sin(end);
  const y = 30 - r * Math.cos(end);
  const slice =
    share >= 1
      ? null
      : `M30 30 L30 ${30 - r} A${r} ${r} 0 ${share > 0.5 ? 1 : 0} 1 ${x.toFixed(2)} ${y.toFixed(2)} Z`;
  return (
    <svg viewBox="0 0 60 60" className={classes.pizza} aria-hidden>
      <circle
        cx="30"
        cy="30"
        r="29"
        fill="var(--klavio-locked-bg)"
        stroke="var(--klavio-locked-border)"
        strokeWidth="1.5"
      />
      {share > 0 &&
        (slice ? (
          <path
            d={slice}
            fill="var(--mantine-color-yellow-4)"
            stroke="var(--mantine-color-orange-6)"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        ) : (
          <circle
            cx="30"
            cy="30"
            r={r}
            fill="var(--mantine-color-yellow-4)"
            stroke="var(--mantine-color-orange-6)"
            strokeWidth="2"
          />
        ))}
      {share > 0 && (
        <g fill="var(--mantine-color-red-6)">
          <circle cx="24" cy="16" r="3" />
          {share >= 0.5 && <circle cx="42" cy="34" r="3" />}
          {share >= 1 && <circle cx="20" cy="40" r="3" />}
        </g>
      )}
    </svg>
  );
}

/** Note values side by side, each with its name, beats and (optionally) a pizza share. */
export function NoteValues({ values, pizza = false }: { values: Value[]; pizza?: boolean }) {
  const { t } = useTranslation();
  return (
    <Group justify="center" gap="xl" className={classes.noteValues}>
      {values.map((v) => (
        <Stack key={v} align="center" gap={4}>
          <NoteSymbol value={v} />
          {pizza && <Pizza share={SHARE[v]} />}
          <Text fw={800}>{t(`theory.values.${v}`)}</Text>
          <Text size="sm" c="dimmed" fw={700}>
            {t('theory.beats', { count: BEATS[v] })}
          </Text>
        </Stack>
      ))}
    </Group>
  );
}

/** One bar as a row of note symbols (for clapping along). */
export function NoteRow({ pattern }: { pattern: RhythmValue[] }) {
  const { t } = useTranslation();
  // dotted notes and eighths: real notation (the big symbols only know w, h, q and the rest)
  if (pattern.some((v) => v === 'qd' || v === 'hd' || v === '8')) {
    return (
      <div style={{ width: 'min(100%, 420px)' }}>
        <Staff
          clef="treble"
          bars={[pattern.map((v) => ({ midi: 72, duration: v }))]}
          height={150}
          label={pattern.map((v) => t(`theory.values.${v}`, { defaultValue: v })).join(', ')}
        />
      </div>
    );
  }
  const shown = pattern.map((v): Value =>
    v === 'qr' ? 'qr' : v === 'w' ? 'w' : v.startsWith('h') ? 'h' : 'q',
  );
  return (
    <Group
      gap="lg"
      justify="center"
      className={classes.noteRow}
      role="img"
      aria-label={shown.map((v) => t(`theory.values.${v}`)).join(', ')}
    >
      {shown.map((v, i) => (
        <NoteSymbol key={i} value={v} />
      ))}
    </Group>
  );
}
