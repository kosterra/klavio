import { useState } from 'react';
import { Alert, Badge, Button, Group, SegmentedControl, Stack, Text, Title } from '@mantine/core';
import { IconMicrophone, IconPiano, IconPlayerStop } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { midiToPitchName } from '@klavio/shared';
import type { Timbre } from '../audio/synth';
import { usePitchDetection } from '../audio/usePitchDetection';
import { microphoneSupported } from '../audio/microphone';
import { useMicErrorText } from '../audio/micErrorText';
import { useSession } from '../auth/session';
import { BuddySays } from '../components/BuddySays';
import { VirtualKeyboard } from '../components/VirtualKeyboard';
import { usePageTitle } from '../components/usePageTitle';
import { useMidi } from '../input/useMidi';
import { useNoteEvents } from '../input/noteBus';
import { GrandStaff } from '../notation/GrandStaff';
import classes from './FreePlayPage.module.css';

const TIMBRES: Timbre[] = ['piano', 'musicbox', 'marimba', 'organ'];
/** How many of the last notes stay visible as a little trail. */
const TRAIL = 8;

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
  const midi = useMidi();
  const mic = usePitchDetection({
    a4Hz: activeProfile?.calibration.a4Hz ?? 440,
    noiseFloorDb: activeProfile?.calibration.noiseFloorDb ?? null,
  });
  const micErrorText = useMicErrorText();
  const midiDevice = midi.devices[0]?.name ?? null;
  const listening = mic.status === 'running';

  useNoteEvents((e) => {
    if (e.type !== 'note-on') return;
    setPlayed((p) => [...p.slice(-(TRAIL - 1)), { midi: e.midi, n: (p.at(-1)?.n ?? 0) + 1 }]);
  });

  const last = played.at(-1) ?? null;
  const name = (m: number) => midiToPitchName(m, lang);

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

      {/* the real piano: a digital piano is simply there, an acoustic one listens through the mic */}
      <Group justify="center" gap="md">
        <Group justify="center" gap="sm" data-testid="free-input">
          {midiDevice ? (
            <Badge size="lg" color="teal" variant="light" leftSection={<IconPiano size={16} />}>
              {t('freePlay.midi', { device: midiDevice })}
            </Badge>
          ) : listening ? (
            <>
              <Badge
                size="lg"
                color="teal"
                variant="light"
                leftSection={<IconMicrophone size={16} />}
                className={classes.listening}
                data-testid="free-listening"
              >
                {t('freePlay.listening')}
              </Badge>
              <Button
                variant="subtle"
                leftSection={<IconPlayerStop size={18} />}
                onClick={() => void mic.stop()}
              >
                {t('freePlay.stopMic')}
              </Button>
            </>
          ) : (
            microphoneSupported() && (
              <Button
                size="md"
                variant="light"
                leftSection={<IconMicrophone />}
                loading={mic.status === 'starting'}
                onClick={() => void mic.start()}
                data-testid="free-mic"
              >
                {t('freePlay.startMic')}
              </Button>
            )
          )}
        </Group>
        <SegmentedControl
          value={timbre}
          onChange={(v) => setTimbre(v as Timbre)}
          data={TIMBRES.map((v) => ({ value: v, label: t(`freePlay.sounds.${v}`) }))}
          aria-label={t('freePlay.sound')}
          size="sm"
        />
      </Group>
      {mic.status === 'error' && (
        <Alert color="red" variant="light">
          {micErrorText(mic.error)}
        </Alert>
      )}

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
            height={240}
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
