import { useState } from 'react';
import { ActionIcon, Button, Group, SegmentedControl, Stack, Text, Title } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconChevronLeft, IconChevronRight, IconKeyboard } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { midiToPitchName } from '@klavio/shared';
import type { Timbre } from '../audio/synth';
import { useSession } from '../auth/session';
import { BuddySays } from '../components/BuddySays';
import { PlayTabs } from '../components/PlayTabs';
import { RealPianoInput } from '../components/RealPianoInput';
import { VirtualKeyboard } from '../components/VirtualKeyboard';
import { usePageTitle } from '../components/usePageTitle';
import { useNoteEvents } from '../input/noteBus';
import { GrandStaff } from '../notation/GrandStaff';
import { usePlayOn } from '../lesson/playOn';
import classes from './FreePlayPage.module.css';

const TIMBRES: Timbre[] = ['piano', 'musicbox', 'marimba', 'organ'];
/** How many of the last notes stay visible as a little trail. */
const TRAIL = 8;
/** the whole keyboard on wider screens: C3 to C6 */
const FULL = { from: 48, to: 84 };
/** phones: C to the E an octave up – ten white keys, no scrolling sideways */
const SPAN = 16;
const LOWEST_C = 36;
const HIGHEST_C = 84;

interface Played {
  midi: number;
  /** running number: a new key restarts the pop animation, even for the same note */
  n: number;
}

/**
 * Free play: no task, no stars – just play. On the screen keys with four
 * sounds, on a digital piano (MIDI) or on the real piano through the
 * microphone. Every note played lights up on the keyboard, pops up with its
 * name and shows where it sits in the notes.
 */
export function FreePlayPage() {
  const { t, i18n } = useTranslation();
  usePageTitle(t('freePlay.title'));
  const { activeProfile } = useSession();
  const kids = activeProfile?.uiMode !== 'classic';
  const lang = i18n.language.startsWith('de') ? 'de' : 'en';
  const [timbre, setTimbre] = useState<Timbre>('piano');
  const [played, setPlayed] = useState<Played[]>([]);
  const [playOn] = usePlayOn();
  // on the real piano the screen keys stay away – one tap brings them
  const [screenKeys, setScreenKeys] = useState(playOn === 'screen');
  const phone = useMediaQuery('(max-width: 36em)') ?? false;
  const [base, setBase] = useState(60);
  const range = phone ? { from: base, to: base + SPAN } : FULL;

  useNoteEvents((e) => {
    if (e.type !== 'note-on') return;
    setPlayed((p) => [...p.slice(-(TRAIL - 1)), { midi: e.midi, n: (p.at(-1)?.n ?? 0) + 1 }]);
    // a note from the real piano outside the keys shown: the keys follow it
    if (phone && e.source !== 'keyboard' && (e.midi < base || e.midi > base + SPAN)) {
      setBase(Math.min(HIGHEST_C - 12, Math.max(LOWEST_C, e.midi - (e.midi % 12))));
    }
  });

  const last = played.at(-1) ?? null;
  const name = (m: number) => midiToPitchName(m, lang);

  return (
    <Stack gap="lg" maw={1100} mx="auto" className={classes.page}>
      <Title order={1}>{t('freePlay.title')}</Title>
      <PlayTabs />
      {!(phone && screenKeys) && (
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
      )}

      {/* the real piano: a digital piano is simply there, an acoustic one listens through the mic */}
      <Group justify="center" gap="md">
        <RealPianoInput prominent={!screenKeys} />
        {screenKeys && (
          <SegmentedControl
            value={timbre}
            onChange={(v) => setTimbre(v as Timbre)}
            data={TIMBRES.map((v) => ({ value: v, label: t(`freePlay.sounds.${v}`) }))}
            aria-label={t('freePlay.sound')}
            size="sm"
          />
        )}
        {screenKeys && phone && (
          // a phone shows ten white keys: move them by an octave
          <Group justify="center" gap="xs" data-testid="free-octave">
            <ActionIcon
              variant="default"
              size="lg"
              radius="xl"
              aria-label={t('freePlay.lower')}
              disabled={base <= LOWEST_C}
              onClick={() => setBase((b) => Math.max(LOWEST_C, b - 12))}
            >
              <IconChevronLeft size={20} />
            </ActionIcon>
            <Text fw={700} miw={90} ta="center">
              {name(range.from)}
              {Math.floor(range.from / 12) - 1} – {name(range.to)}
              {Math.floor(range.to / 12) - 1}
            </Text>
            <ActionIcon
              variant="default"
              size="lg"
              radius="xl"
              aria-label={t('freePlay.higher')}
              disabled={base >= HIGHEST_C - 12}
              onClick={() => setBase((b) => Math.min(HIGHEST_C - 12, b + 12))}
            >
              <IconChevronRight size={20} />
            </ActionIcon>
          </Group>
        )}
      </Group>

      <div className={classes.show}>
        <div className={classes.left}>
          <div className={classes.note} aria-live="polite" data-testid="free-note">
            {last ? (
              <span key={last.n} className={classes.pop}>
                {name(last.midi)}
              </span>
            ) : (
              <span className={classes.empty}>♪</span>
            )}
          </div>
          {played.length > 0 && (
            <ol className={classes.trail} aria-label={t('freePlay.trail')}>
              {played.map((p, i) => (
                <li key={p.n} className={i === played.length - 1 ? classes.trailLast : undefined}>
                  {name(p.midi)}
                </li>
              ))}
            </ol>
          )}
        </div>
        <div className={classes.staff} data-testid="free-staff">
          <GrandStaff
            height={phone ? 170 : 240}
            label={
              last ? t('freePlay.staffLabel', { note: name(last.midi) }) : t('freePlay.staffEmpty')
            }
            bars={[
              last
                ? last.midi >= 60
                  ? { rh: [{ midi: last.midi, duration: 'w', state: 'current' }], lh: [] }
                  : { rh: [], lh: [{ midi: last.midi, duration: 'w', state: 'current' }] }
                : { rh: [], lh: [] },
            ]}
          />
        </div>
      </div>

      {screenKeys ? (
        <>
          <VirtualKeyboard
            dock
            from={range.from}
            to={range.to}
            labels="c"
            height={220}
            timbre={timbre}
            computerKeysFrom={60}
          />
        </>
      ) : (
        <Group justify="center">
          <Button
            variant="subtle"
            leftSection={<IconKeyboard size={18} />}
            onClick={() => setScreenKeys(true)}
            data-testid="free-show-keys"
          >
            {t('freePlay.showKeys')}
          </Button>
        </Group>
      )}
    </Stack>
  );
}
