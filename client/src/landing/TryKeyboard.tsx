import { useState } from 'react';
import { Button, Group, Stack, Text } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { PianoKeyboard } from '../components/PianoKeyboard';
import { playNote } from '../audio/synth';
import { Staff, type StaffNote } from '../notation/Staff';
import classes from './Landing.module.css';

/** «Alle meine Entchen», the first phrase – as in the first song lesson. */
const ENTCHEN: { midi: number; duration: string }[] = [
  { midi: 60, duration: 'q' },
  { midi: 62, duration: 'q' },
  { midi: 64, duration: 'q' },
  { midi: 65, duration: 'q' },
  { midi: 67, duration: 'h' },
  { midi: 67, duration: 'h' },
];

/**
 * The landing page's mini lesson: the first notes of «Alle meine Entchen» on
 * the staff, the next key lights up – play them and the ducks parade across
 * the screen. A wrong key just sounds; the song waits, like in Klavio.
 */
export function TryKeyboard({ onDucks }: { onDucks: () => void }) {
  const { t } = useTranslation();
  const [at, setAt] = useState(0);
  const [held, setHeld] = useState<number[]>([]);
  const done = at >= ENTCHEN.length;

  const bars: StaffNote[][] = [ENTCHEN.slice(0, 4), ENTCHEN.slice(4)].map((bar, b) =>
    bar.map((n, i) => {
      const k = b * 4 + i;
      return { ...n, state: k < at ? 'done' : k === at ? 'current' : undefined };
    }),
  );

  return (
    <Stack gap="sm" className={classes.tryBox} data-testid="try">
      <div className={classes.tryStaff}>
        <Staff clef="treble" time="4/4" bars={bars} height={120} label={t('landing.tryStaff')} />
      </div>
      <Text ta="center" fw={800} aria-live="polite" data-testid="try-status">
        {done ? t('landing.tryDone') : t('landing.tryCount', { n: at, total: ENTCHEN.length })}
      </Text>
      <PianoKeyboard
        from={60}
        to={72}
        labels="all"
        height={130}
        active={held}
        hints={done ? [] : [ENTCHEN[at]!.midi]}
        onPress={(m) => {
          const v = playNote(m, 0.7);
          setTimeout(() => v?.release(), 500);
          setHeld((h) => [...h, m]);
          setTimeout(() => setHeld((h) => h.filter((x) => x !== m)), 220);
          if (done || m !== ENTCHEN[at]!.midi) return;
          const next = at + 1;
          setAt(next);
          if (next === ENTCHEN.length) onDucks();
        }}
      />
      {done && (
        <Group justify="center">
          <Button variant="subtle" leftSection={<IconRefresh size={18} />} onClick={() => setAt(0)}>
            {t('landing.tryAgain')}
          </Button>
        </Group>
      )}
    </Stack>
  );
}
