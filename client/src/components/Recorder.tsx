import { useEffect, useRef, useState } from 'react';
import { Button, Group, Text } from '@mantine/core';
import {
  IconPlayerPlayFilled,
  IconPlayerRecordFilled,
  IconPlayerStopFilled,
  IconTrash,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { playNote, type Timbre, type Voice } from '../audio/synth';
import { inputHub, useNoteEvents } from '../input/noteBus';

/** A note played: when (ms after the start), how long, how hard. */
interface Take {
  midi: number;
  at: number;
  length: number;
  velocity: number;
}

/** Long enough for a piece, short enough to stay small in memory. */
const MAX_MS = 2 * 60 * 1000;
/** a note without its «key up» (the microphone): this long */
const DEFAULT_LENGTH = 450;

/**
 * «Aufnehmen»: records the notes played (not the sound – nothing leaves the
 * device, nothing is stored) and plays them back with the chosen sound.
 * Playing back mutes the microphone, so it does not record itself.
 */
export function Recorder({ timbre }: { timbre: Timbre }) {
  const { t } = useTranslation();
  const [state, setState] = useState<'idle' | 'recording' | 'playing'>('idle');
  const [take, setTake] = useState<Take[]>([]);
  const [seconds, setSeconds] = useState(0);
  const start = useRef(0);
  const open = useRef(new Map<number, Take>());
  const recorded = useRef<Take[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const voices = useRef<Voice[]>([]);
  const tick = useRef<ReturnType<typeof setInterval>>(undefined);

  const clearPlayback = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    voices.current.forEach((v) => v.release());
    voices.current = [];
  };
  useEffect(
    () => () => {
      clearPlayback();
      clearInterval(tick.current);
      inputHub.muteMicrophoneUntil(0);
    },
    [],
  );

  const stopRecording = () => {
    clearInterval(tick.current);
    const end = performance.now() - start.current;
    for (const n of open.current.values()) n.length = Math.max(80, end - n.at);
    open.current.clear();
    setTake([...recorded.current]);
    setState('idle');
  };

  useNoteEvents((e) => {
    if (state !== 'recording') return;
    const at = e.time - start.current;
    if (at > MAX_MS) {
      stopRecording();
      return;
    }
    if (e.type === 'note-on') {
      // the same key again before its «up» (microphone): end the old one
      const before = open.current.get(e.midi);
      if (before) before.length = Math.max(80, at - before.at);
      const n: Take = { midi: e.midi, at, length: DEFAULT_LENGTH, velocity: e.velocity };
      recorded.current.push(n);
      open.current.set(e.midi, n);
    } else {
      const n = open.current.get(e.midi);
      if (n) {
        n.length = Math.max(80, at - n.at);
        open.current.delete(e.midi);
      }
    }
  });

  const record = () => {
    clearPlayback();
    recorded.current = [];
    open.current.clear();
    start.current = performance.now();
    setSeconds(0);
    setState('recording');
    tick.current = setInterval(() => {
      const s = Math.floor((performance.now() - start.current) / 1000);
      setSeconds(s);
      if (s * 1000 >= MAX_MS) stopRecording();
    }, 250);
  };

  const play = () => {
    if (!take.length) return;
    clearPlayback();
    const total = Math.max(...take.map((n) => n.at + n.length));
    inputHub.muteMicrophoneUntil(performance.now() + total + 600);
    setState('playing');
    for (const n of take) {
      timers.current.push(
        setTimeout(() => {
          const v = playNote(n.midi, Math.max(0.3, n.velocity), timbre);
          if (!v) return;
          voices.current.push(v);
          timers.current.push(setTimeout(() => v.release(), n.length));
        }, n.at),
      );
    }
    timers.current.push(setTimeout(() => setState('idle'), total + 300));
  };

  const stopPlaying = () => {
    clearPlayback();
    inputHub.muteMicrophoneUntil(performance.now() + 300);
    setState('idle');
  };

  const length = take.length ? Math.ceil(Math.max(...take.map((n) => n.at + n.length)) / 1000) : 0;

  return (
    <Group gap="xs" justify="center" wrap="wrap" data-testid="recorder">
      {state === 'recording' ? (
        <Button
          color="red.8"
          leftSection={<IconPlayerStopFilled size={18} />}
          onClick={stopRecording}
          data-testid="rec-stop"
        >
          {t('recorder.stop', { seconds })}
        </Button>
      ) : (
        <Button
          variant="default"
          leftSection={<IconPlayerRecordFilled size={18} color="var(--mantine-color-red-7)" />}
          onClick={record}
          disabled={state === 'playing'}
          data-testid="rec-start"
        >
          {t('recorder.record')}
        </Button>
      )}
      {take.length > 0 && state !== 'recording' && (
        <>
          {state === 'playing' ? (
            <Button
              variant="light"
              leftSection={<IconPlayerStopFilled size={18} />}
              onClick={stopPlaying}
              data-testid="rec-play"
            >
              {t('recorder.stopPlaying')}
            </Button>
          ) : (
            <Button
              variant="light"
              leftSection={<IconPlayerPlayFilled size={18} />}
              onClick={play}
              data-testid="rec-play"
            >
              {t('recorder.play', { count: take.length, seconds: length })}
            </Button>
          )}
          <Button
            variant="subtle"
            color="gray"
            leftSection={<IconTrash size={18} />}
            onClick={() => {
              stopPlaying();
              setTake([]);
            }}
            disabled={state === 'playing'}
          >
            {t('recorder.delete')}
          </Button>
        </>
      )}
      {state === 'recording' && (
        <Text size="sm" fw={700} c="red.8" aria-live="polite" data-testid="rec-live">
          {t('recorder.recording')}
        </Text>
      )}
    </Group>
  );
}
