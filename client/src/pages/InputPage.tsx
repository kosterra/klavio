import { useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  List,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import {
  IconDeviceDesktop,
  IconMicrophone,
  IconPiano,
  IconPlayerStop,
  IconPlugConnected,
} from '@tabler/icons-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { midiToName, type NoteEvent } from '@klavio/shared';
import { useSession } from '../auth/session';
import { useMidi } from '../input/useMidi';
import { useDroppedNoteEvents, useNoteEvents } from '../input/noteBus';
import { usePitchDetection } from '../audio/usePitchDetection';
import { microphoneSupported } from '../audio/microphone';
import { useMicErrorText } from '../audio/micErrorText';
import { VirtualKeyboard } from '../components/VirtualKeyboard';
import { PrivacyNote } from '../components/PrivacyNote';

type Source = NoteEvent['source'];

/**
 * Overview of the three inputs and their priority (MIDI → microphone →
 * on-screen keyboard), with a live monitor of what arrives from where.
 */
export function InputPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('de') ? 'de' : 'en';
  const { activeProfile } = useSession();
  const midi = useMidi();
  const micErrorText = useMicErrorText();
  const calibration = activeProfile?.calibration;
  const mic = usePitchDetection({
    a4Hz: calibration?.a4Hz ?? 440,
    noiseFloorDb: calibration?.noiseFloorDb ?? null,
  });
  const [last, setLast] = useState<NoteEvent | null>(null);
  const [ignored, setIgnored] = useState<NoteEvent | null>(null);

  useNoteEvents((e) => {
    if (e.type === 'note-on') setLast(e);
  });
  useDroppedNoteEvents((e) => {
    if (e.type === 'note-on') setIgnored(e);
  });

  const midiActive = midi.devices.length > 0;
  const activeSource: Source = midiActive
    ? 'midi'
    : mic.status === 'running'
      ? 'microphone'
      : 'keyboard';
  const sourceLabel = (s: Source) => t(`input.source.${s}`);

  return (
    <Stack gap="lg" maw={1100} mx="auto">
      <div>
        <Title order={1}>{t('input.title')}</Title>
        <Text c="dimmed">{t('input.intro')}</Text>
      </div>

      <Alert color="blue" variant="light" icon={<IconPlugConnected />}>
        <Text fw={700}>
          {t('input.activeNow', {
            source:
              activeSource === 'midi'
                ? `${sourceLabel('midi')} (${midi.devices.map((d) => d.name).join(', ')})`
                : sourceLabel(activeSource),
          })}
        </Text>
        <Text size="sm">{t('input.priority')}</Text>
      </Alert>

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
        {/* ----------------------------------------------------------- MIDI */}
        <Card withBorder radius="xl" padding="lg">
          <Stack gap="sm">
            <Group gap="xs">
              <IconPiano aria-hidden />
              <Title order={2} size="h4">
                {t('input.midi.title')}
              </Title>
              {midiActive && (
                <Badge color="teal" variant="light">
                  {t('input.connected')}
                </Badge>
              )}
            </Group>
            <Text size="sm">{t('input.midi.text')}</Text>
            {midi.status === 'unsupported' && (
              <Alert color="orange">{t('input.midi.unsupported')}</Alert>
            )}
            {midi.status === 'denied' && <Alert color="red">{t('input.midi.denied')}</Alert>}
            {(midi.status === 'idle' || midi.status === 'requesting') && (
              <Button
                leftSection={<IconPlugConnected />}
                loading={midi.status === 'requesting'}
                onClick={() => void midi.connect()}
              >
                {t('input.midi.connect')}
              </Button>
            )}
            {midi.status === 'ready' &&
              (midiActive ? (
                <List size="sm" spacing={4}>
                  {midi.devices.map((d) => (
                    <List.Item key={d.id}>
                      <Text span fw={700}>
                        {d.name}
                      </Text>
                      {d.manufacturer && (
                        <Text span c="dimmed">
                          {' '}
                          · {d.manufacturer}
                        </Text>
                      )}
                    </List.Item>
                  ))}
                </List>
              ) : (
                <Text size="sm" c="dimmed">
                  {t('input.midi.none')}
                </Text>
              ))}
          </Stack>
        </Card>

        {/* ----------------------------------------------------- microphone */}
        <Card withBorder radius="xl" padding="lg">
          <Stack gap="sm">
            <Group gap="xs">
              <IconMicrophone aria-hidden />
              <Title order={2} size="h4">
                {t('input.mic.title')}
              </Title>
              {mic.status === 'running' && (
                <Badge color={midiActive ? 'gray' : 'teal'} variant="light">
                  {midiActive ? t('input.mic.standby') : t('input.mic.on')}
                </Badge>
              )}
            </Group>
            <Text size="sm">{t('input.mic.text')}</Text>
            <Text size="sm" c="dimmed">
              {calibration?.noiseFloorDb == null
                ? t('input.mic.notCalibrated')
                : t('input.mic.calibrated', { hz: calibration.a4Hz.toFixed(1) })}
            </Text>
            {mic.error && <Alert color="red">{micErrorText(mic.error)}</Alert>}
            <Group gap="xs">
              {mic.status === 'running' ? (
                <Button
                  variant="outline"
                  color="red.9"
                  leftSection={<IconPlayerStop />}
                  onClick={() => void mic.stop()}
                >
                  {t('mic.stop')}
                </Button>
              ) : (
                <Button
                  leftSection={<IconMicrophone />}
                  loading={mic.status === 'starting'}
                  disabled={!microphoneSupported()}
                  onClick={() => void mic.start()}
                >
                  {t('input.mic.start')}
                </Button>
              )}
              <Button variant="subtle" component={Link} to="/mic-test">
                {t('mic.title')}
              </Button>
              <Button variant="subtle" component={Link} to="/mic-setup">
                {t('mic.setup')}
              </Button>
            </Group>
          </Stack>
        </Card>

        {/* ------------------------------------------------ screen keyboard */}
        <Card withBorder radius="xl" padding="lg">
          <Stack gap="sm">
            <Group gap="xs">
              <IconDeviceDesktop aria-hidden />
              <Title order={2} size="h4">
                {t('input.screen.title')}
              </Title>
              <Badge color="teal" variant="light">
                {t('input.alwaysOn')}
              </Badge>
            </Group>
            <Text size="sm">{t('input.screen.text')}</Text>
            <Text size="sm" c="dimmed">
              {t('input.screen.keys')}
            </Text>
          </Stack>
        </Card>
      </SimpleGrid>

      <Card withBorder radius="xl" padding="lg">
        <Group justify="space-between" align="flex-start" mb="md">
          <div>
            <Text size="sm" c="dimmed">
              {t('input.lastPlayed')}
            </Text>
            <Group gap="sm" align="baseline" aria-live="polite" aria-atomic>
              <Text fz={56} fw={800} lh={1} data-testid="last-note">
                {last ? midiToName(last.midi, lang) : '–'}
              </Text>
              {last && (
                <Badge size="lg" variant="light" data-testid="last-source">
                  {sourceLabel(last.source)}
                </Badge>
              )}
            </Group>
          </div>
          {ignored && (
            <Text size="sm" c="dimmed" maw={360} data-testid="ignored-note">
              {t('input.ignored', {
                note: midiToName(ignored.midi, lang),
                source: sourceLabel(ignored.source),
                reason:
                  ignored.source === 'microphone' && midiActive
                    ? t('input.ignoredMidi')
                    : t('input.ignoredEcho'),
              })}
            </Text>
          )}
        </Group>
        <VirtualKeyboard from={48} to={84} computerKeysFrom={60} showComputerKeys height={170} />
      </Card>

      <PrivacyNote />
    </Stack>
  );
}
