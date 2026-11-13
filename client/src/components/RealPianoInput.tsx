import { Alert, Badge, Button, Group, Stack } from '@mantine/core';
import { IconMicrophone, IconPiano, IconPlayerStop } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { microphoneSupported } from '../audio/microphone';
import { useMicErrorText } from '../audio/micErrorText';
import classes from './RealPianoInput.module.css';
import type { RealPiano } from './useRealPiano';

/**
 * The real piano outside the lessons: a digital piano (MIDI) is simply
 * there, an acoustic one is heard through the microphone after a tap. The
 * microphone stops when the page is left. `prominent`: the real piano is the
 * learner's way to play – the button is the main thing to tap. `compact`: one
 * small switch for a line next to other things (Notenregen). The page holds
 * the real piano (`useRealPiano`) – it knows when the screen keys only show.
 */
export function RealPianoInput({
  piano,
  prominent = false,
  compact = false,
}: {
  piano: RealPiano;
  prominent?: boolean;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const micErrorText = useMicErrorText();
  const { mic, midiDevice, active } = piano;

  if (compact) {
    return (
      <Stack gap={4} align="center">
        {midiDevice ? (
          <Badge size="lg" color="teal" variant="light" leftSection={<IconPiano size={16} />}>
            MIDI
          </Badge>
        ) : (
          microphoneSupported() && (
            // one switch: on = it listens (the microphone pulses), off = the screen keys
            <Button
              size="compact-md"
              h={44}
              radius="xl"
              variant={active ? 'light' : 'default'}
              color={active ? 'teal' : undefined}
              leftSection={
                <IconMicrophone
                  size={18}
                  aria-hidden
                  className={active ? classes.listening : undefined}
                />
              }
              loading={mic.status === 'starting'}
              aria-pressed={active}
              onClick={() => void (active ? mic.stop() : mic.start())}
              data-testid="real-piano-mic"
            >
              {t('freePlay.mic')}
            </Button>
          )
        )}
        {mic.status === 'error' && (
          <Alert color="red" variant="light" p="xs">
            {micErrorText(mic.error)}
          </Alert>
        )}
      </Stack>
    );
  }

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
              size={prominent ? 'lg' : 'md'}
              variant={prominent ? 'filled' : 'light'}
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
