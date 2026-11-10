import { Alert, Badge, Button, Group, Stack } from '@mantine/core';
import { IconMicrophone, IconPiano, IconPlayerStop } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { usePitchDetection } from '../audio/usePitchDetection';
import { microphoneSupported } from '../audio/microphone';
import { useMicErrorText } from '../audio/micErrorText';
import { useSession } from '../auth/session';
import { useMidi } from '../input/useMidi';
import classes from './RealPianoInput.module.css';

/**
 * The real piano outside the lessons: a digital piano (MIDI) is simply
 * there, an acoustic one is heard through the microphone after a tap. The
 * microphone stops when the page is left.
 */
export function RealPianoInput() {
  const { t } = useTranslation();
  const { activeProfile } = useSession();
  const midi = useMidi();
  const mic = usePitchDetection({
    a4Hz: activeProfile?.calibration.a4Hz ?? 440,
    noiseFloorDb: activeProfile?.calibration.noiseFloorDb ?? null,
  });
  const micErrorText = useMicErrorText();
  const midiDevice = midi.devices[0]?.name ?? null;

  return (
    <Stack gap="xs" align="center">
      <Group justify="center" gap="sm" data-testid="real-piano">
        {midiDevice ? (
          <Badge size="lg" color="teal" variant="light" leftSection={<IconPiano size={16} />}>
            {t('freePlay.midi', { device: midiDevice })}
          </Badge>
        ) : mic.status === 'running' ? (
          <>
            <Badge
              size="lg"
              color="teal"
              variant="light"
              leftSection={<IconMicrophone size={16} />}
              className={classes.listening}
              data-testid="real-piano-listening"
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
              data-testid="real-piano-mic"
            >
              {t('freePlay.startMic')}
            </Button>
          )
        )}
      </Group>
      {mic.status === 'error' && (
        <Alert color="red" variant="light">
          {micErrorText(mic.error)}
        </Alert>
      )}
    </Stack>
  );
}
