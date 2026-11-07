import { useState } from 'react';
import { Alert, Button, Card, Group, SimpleGrid, Stack, Table, Text, Title } from '@mantine/core';
import { IconAdjustments, IconMicrophone, IconPlayerStop } from '@tabler/icons-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { midiToName, type NoteEvent } from '@klavio/shared';
import { useSession } from '../auth/session';
import { usePitchDetection } from '../audio/usePitchDetection';
import { microphoneSupported } from '../audio/microphone';
import { useMicErrorText } from '../audio/micErrorText';
import { useRawNoteEvents } from '../input/noteBus';
import { PianoKeyboard } from '../components/PianoKeyboard';
import { CentsMeter, LevelMeter } from '../components/Meters';
import { PrivacyNote } from '../components/PrivacyNote';

const TOLERANCE = 35;

/** Live view of the microphone pitch detection: note, tuning, level, event log. */
export function MicTestPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('de') ? 'de' : 'en';
  const { activeProfile } = useSession();
  const micErrorText = useMicErrorText();
  const calibration = activeProfile?.calibration;
  const pitch = usePitchDetection({
    a4Hz: calibration?.a4Hz ?? 440,
    noiseFloorDb: calibration?.noiseFloorDb ?? null,
    toleranceCents: TOLERANCE,
  });
  const [log, setLog] = useState<(NoteEvent & { at: number })[]>([]);
  const [startedAt, setStartedAt] = useState(0);

  useRawNoteEvents((e) => {
    if (e.type === 'note-on' && e.source === 'microphone') {
      setLog((l) => [{ ...e, at: e.time - startedAt }, ...l].slice(0, 12));
    }
  });

  const { live, info, status } = pitch;
  const running = status === 'running';

  return (
    <Stack gap="lg" maw={1100} mx="auto">
      <Group justify="space-between" align="flex-end">
        <div>
          <Title order={1}>{t('mic.title')}</Title>
          <Text c="dimmed">{t('mic.intro')}</Text>
        </div>
        <Button variant="light" leftSection={<IconAdjustments />} component={Link} to="/mic-setup">
          {t('mic.setup')}
        </Button>
      </Group>

      <PrivacyNote />

      {!microphoneSupported() && <Alert color="orange">{t('mic.errors.MIC_UNSUPPORTED')}</Alert>}
      {pitch.error && (
        <Alert color="red" role="alert" title={t('mic.errorTitle')}>
          {micErrorText(pitch.error)}
        </Alert>
      )}
      {calibration?.noiseFloorDb == null && <Alert color="blue">{t('mic.notCalibrated')}</Alert>}

      <Group>
        {running ? (
          <Button
            size="lg"
            color="red.9"
            variant="outline"
            leftSection={<IconPlayerStop />}
            onClick={() => void pitch.stop()}
          >
            {t('mic.stop')}
          </Button>
        ) : (
          <Button
            size="lg"
            leftSection={<IconMicrophone />}
            loading={status === 'starting'}
            disabled={!microphoneSupported()}
            onClick={() => {
              setStartedAt(performance.now());
              setLog([]);
              void pitch.start();
            }}
          >
            {t('mic.start')}
          </Button>
        )}
        {running && (
          <Text c="dimmed" size="sm">
            {t('mic.listening')}
          </Text>
        )}
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
        <Card withBorder radius="xl" padding="lg">
          <Stack gap="sm" align="center">
            <Text size="sm" c="dimmed">
              {t('mic.detected')}
            </Text>
            <Text
              fz={88}
              fw={800}
              lh={1}
              aria-live="polite"
              aria-atomic
              data-testid="detected-note"
            >
              {live.note !== null ? midiToName(live.note, lang) : '–'}
            </Text>
            <Text c="dimmed">
              {live.frequency && live.note !== null ? `${live.frequency.toFixed(1)} Hz` : ' '}
            </Text>
            <div style={{ width: '100%' }}>
              <CentsMeter cents={live.note !== null ? live.cents : null} tolerance={TOLERANCE} />
            </div>
          </Stack>
        </Card>

        <Card withBorder radius="xl" padding="lg">
          <Stack gap="md">
            <div>
              <Text fw={700} mb={4}>
                {t('mic.level')}
              </Text>
              <LevelMeter levelDb={live.levelDb} gateDb={live.gateDb} />
              <Text size="xs" c="dimmed" mt={4}>
                {t('mic.gateHint')}
              </Text>
            </div>
            <Table variant="vertical" withTableBorder={false} fz="sm">
              <Table.Tbody>
                <Row
                  label={t('mic.clarity')}
                  value={live.clarity ? live.clarity.toFixed(2) : '–'}
                />
                <Row label={t('mic.a4')} value={`${(calibration?.a4Hz ?? 440).toFixed(1)} Hz`} />
                <Row
                  label={t('mic.sampleRate')}
                  value={info ? `${(info.sampleRate / 1000).toFixed(1)} kHz` : '–'}
                />
                <Row
                  label={t('mic.window')}
                  value={
                    info
                      ? `${Math.round((info.windowSize / info.sampleRate) * 1000)} ms / ${(
                          (info.hopSize / info.sampleRate) *
                          1000
                        ).toFixed(1)} ms`
                      : '–'
                  }
                />
                <Row label={t('mic.cost')} value={running ? `${live.costMs.toFixed(2)} ms` : '–'} />
                <Row label={t('mic.device')} value={info?.deviceLabel || '–'} />
              </Table.Tbody>
            </Table>
          </Stack>
        </Card>
      </SimpleGrid>

      <Card withBorder radius="xl" padding="lg">
        <PianoKeyboard
          from={36}
          to={96}
          active={live.note !== null ? [live.note] : []}
          height={110}
        />
      </Card>

      <Card withBorder radius="xl" padding="lg">
        <Title order={2} size="h4" mb="sm">
          {t('mic.log')}
        </Title>
        {log.length === 0 ? (
          <Text c="dimmed">{t('mic.logEmpty')}</Text>
        ) : (
          <Table striped fz="sm" aria-live="polite">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('mic.logNote')}</Table.Th>
                <Table.Th>{t('mic.logCents')}</Table.Th>
                <Table.Th>{t('mic.logVelocity')}</Table.Th>
                <Table.Th>{t('mic.logTime')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {log.map((e) => (
                <Table.Tr key={`${e.time}-${e.midi}`}>
                  <Table.Td fw={700}>{midiToName(e.midi, lang)}</Table.Td>
                  <Table.Td>{e.cents ?? 0}</Table.Td>
                  <Table.Td>{Math.round(e.velocity * 100)} %</Table.Td>
                  <Table.Td>{(e.at / 1000).toFixed(2)} s</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>
    </Stack>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Table.Tr>
      <Table.Th w="45%">{label}</Table.Th>
      <Table.Td>{value}</Table.Td>
    </Table.Tr>
  );
}
