import { useState } from 'react';
import { Group, SegmentedControl, Stack, Text, Title } from '@mantine/core';
import { IconTrophy } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useSession } from '../auth/session';
import { PlayTabs } from '../components/PlayTabs';
import { RealPianoInput } from '../components/RealPianoInput';
import { usePageTitle } from '../components/usePageTitle';
import { NoteRainGame, type RainClef } from '../lesson/NoteRainGame';

type Range = 'few' | 'more';

const WHITE = new Set([0, 2, 4, 5, 7, 9, 11]);
const whites = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i).filter((m) => WHITE.has(m % 12));

/** The notes that may fall: a few around the middle to start, then more. */
const NOTES: Record<RainClef, Record<Range, number[]>> = {
  treble: { few: whites(60, 67), more: whites(60, 79) }, // C4–G4 · C4–G5
  bass: { few: whites(48, 55), more: whites(41, 60) }, // C3–G3 · F2–C4
  both: { few: [...whites(48, 55), ...whites(60, 67)], more: whites(41, 79) },
};

const BEST_KEY = 'klavio-rain-best';

type Best = Partial<Record<`${RainClef}-${Range}`, number>>;

function readBest(profileId: string | undefined): Best {
  try {
    return JSON.parse(localStorage.getItem(`${BEST_KEY}:${profileId ?? ''}`) ?? '{}') as Best;
  } catch {
    return {};
  }
}

function writeBest(profileId: string | undefined, best: Best) {
  try {
    localStorage.setItem(`${BEST_KEY}:${profileId ?? ''}`, JSON.stringify(best));
  } catch {
    // not kept – fine
  }
}

/**
 * Endless «Notenregen» under «Spielen»: it rains until three notes land, and
 * faster and faster. Treble, bass or both, a few notes or many – and a record
 * to beat (kept on this device, per profile). Practice only, nothing is scored.
 */
export function RainGamePage() {
  const { t } = useTranslation();
  usePageTitle(t('rainGame.title'));
  const { activeProfile } = useSession();
  const kids = activeProfile?.uiMode !== 'classic';
  const [clef, setClef] = useState<RainClef>('treble');
  const [range, setRange] = useState<Range>('few');
  const [best, setBest] = useState<Best>(() => readBest(activeProfile?.id));
  const [record, setRecord] = useState(false);
  const mode = `${clef}-${range}` as const;
  const notes = NOTES[clef][range];
  const from = Math.floor(Math.min(...notes) / 12) * 12; // from the C below
  const to = Math.max(...notes);
  const top = best[mode] ?? 0;

  return (
    <Stack gap="md" maw={1100} mx="auto">
      <Title order={1}>{t('rainGame.title')}</Title>
      <PlayTabs />
      <Text size="sm">{t('rainGame.intro')}</Text>
      <Group gap="sm" justify="center">
        <SegmentedControl
          value={clef}
          onChange={(v) => setClef(v as RainClef)}
          aria-label={t('rainGame.clef')}
          data={(['treble', 'bass', 'both'] as const).map((c) => ({
            value: c,
            label: t(`rainGame.clefs.${c}`),
          }))}
        />
        <SegmentedControl
          value={range}
          onChange={(v) => setRange(v as Range)}
          aria-label={t('rainGame.range')}
          data={(['few', 'more'] as const).map((r) => ({
            value: r,
            label: t(`rainGame.ranges.${r}`),
          }))}
        />
        <RealPianoInput />
      </Group>
      <NoteRainGame
        // a new choice: a new game
        key={mode}
        clef={clef}
        notes={notes}
        fall={range === 'few' ? 7 : 8}
        fastest={1.8}
        kids={kids}
        keyboard={{ from, to }}
        labels={kids ? 'all' : 'c'}
        interactive
        compact
        status={(caught) => (
          <>
            {t('rainGame.caught', { count: caught })}
            {top > 0 && (
              <Text span c="dimmed" fw={600}>
                {' · '}
                <IconTrophy size={16} aria-hidden style={{ verticalAlign: -2 }} />{' '}
                {t('rainGame.best', { count: top })}
              </Text>
            )}
          </>
        )}
        onOver={({ caught }) => {
          const beaten = caught > top;
          setRecord(beaten && caught > 0);
          if (beaten) {
            const next = { ...best, [mode]: caught };
            setBest(next);
            writeBest(activeProfile?.id, next);
          }
        }}
        overText={({ caught }) =>
          record ? t('rainGame.record', { count: caught }) : t('rainGame.over', { count: caught })
        }
      />
    </Stack>
  );
}
