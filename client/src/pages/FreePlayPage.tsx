import { useState } from 'react';
import { SegmentedControl, Stack, Text, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { midiToPitchName } from '@klavio/shared';
import type { Timbre } from '../audio/synth';
import { useSession } from '../auth/session';
import { BuddySays } from '../components/BuddySays';
import { VirtualKeyboard } from '../components/VirtualKeyboard';
import { usePageTitle } from '../components/usePageTitle';
import { useNoteEvents } from '../input/noteBus';
import classes from './FreePlayPage.module.css';

const TIMBRES: Timbre[] = ['piano', 'musicbox', 'marimba', 'organ'];

/**
 * Free play: no task, no stars – just play. On the screen keys with four
 * sounds, or on the real piano (the names of the notes light up).
 */
export function FreePlayPage() {
  const { t, i18n } = useTranslation();
  usePageTitle(t('freePlay.title'));
  const { activeProfile } = useSession();
  const kids = activeProfile?.uiMode !== 'classic';
  const lang = i18n.language.startsWith('de') ? 'de' : 'en';
  const [timbre, setTimbre] = useState<Timbre>('piano');
  const [last, setLast] = useState<{ midi: number; n: number } | null>(null);

  useNoteEvents((e) => {
    if (e.type === 'note-on') setLast((l) => ({ midi: e.midi, n: (l?.n ?? 0) + 1 }));
  });

  return (
    <Stack gap="lg" maw={1100} mx="auto" className={classes.page}>
      <Title order={1}>{t('freePlay.title')}</Title>
      <BuddySays
        mood={last ? 'cheer' : 'happy'}
        size={kids ? 96 : 64}
        kids={kids}
        say={t('freePlay.hint')}
      >
        <Text fz="lg" fw={700}>
          {t('freePlay.hint')}
        </Text>
      </BuddySays>
      <div className={classes.note} aria-live="polite" data-testid="free-note">
        {last ? (
          <span key={last.n} className={classes.pop}>
            {midiToPitchName(last.midi, lang)}
          </span>
        ) : (
          <span className={classes.empty}>♪</span>
        )}
      </div>
      <SegmentedControl
        value={timbre}
        onChange={(v) => setTimbre(v as Timbre)}
        data={TIMBRES.map((v) => ({ value: v, label: t(`freePlay.sounds.${v}`) }))}
        aria-label={t('freePlay.sound')}
        fullWidth
        size="md"
      />
      <VirtualKeyboard
        dock
        from={48}
        to={84}
        labels="c"
        height={220}
        timbre={timbre}
        computerKeysFrom={60}
      />
    </Stack>
  );
}
