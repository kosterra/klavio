import { useEffect, useRef, useState } from 'react';
import { Button, Group, Stack, Text } from '@mantine/core';
import { IconCheck, IconEar } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { midiToPitchName, type EchoExercise as Spec } from '@klavio/shared';
import { inputHub, useNoteEvents } from '../input/noteBus';
import { playMelody, type Playback } from '../audio/synth';
import { BuddySays } from '../components/BuddySays';
import { VirtualKeyboard } from '../components/VirtualKeyboard';
import { FEEDBACK_MS, type ExerciseProps } from './exercises';
import { useNoteLang } from './useLocalized';

/**
 * "Hör zu und spiel nach": Klavi plays a few notes without showing them; the
 * learner plays them back by ear. A wrong note starts the motif again (it is
 * played once more), a right one is revealed.
 */
export function EchoExercise({
  exercise,
  lesson,
  inputMode,
  kids,
  onCorrect,
  onMistake,
  onDone,
}: ExerciseProps<Spec>) {
  const { t } = useTranslation();
  const lang = useNoteLang();
  const [index, setIndex] = useState(0);
  const [pos, setPos] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [wrong, setWrong] = useState<number | null>(null);
  const playback = useRef<Playback | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const motif = exercise.motifs[index]!;

  const play = () => {
    playback.current?.stop();
    const melody = motif.map((midi) => ({ midi, beats: 1 }));
    const ms = (melody.length * 60000) / exercise.tempo;
    // the microphone would hear Klavi's notes as the learner's
    inputHub.muteMicrophoneUntil(performance.now() + ms + 500);
    setPlaying(true);
    const p = playMelody(melody, exercise.tempo);
    playback.current = p;
    void p.done.then(() => setPlaying(false));
  };

  // every new motif is played by itself (the start tap was the user gesture)
  useEffect(() => {
    const id = setTimeout(play, 500);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      playback.current?.stop();
    },
    [],
  );

  useNoteEvents((e) => {
    if (e.type !== 'note-on' || playing) return;
    if (e.midi === motif[pos]) {
      onCorrect();
      setWrong(null);
      const next = pos + 1;
      setPos(next);
      if (next >= motif.length) {
        timer.current = setTimeout(() => {
          setPos(0);
          if (index + 1 >= exercise.motifs.length) onDone();
          else setIndex(index + 1);
        }, FEEDBACK_MS);
      }
    } else {
      onMistake(motif[pos]);
      setWrong(e.midi);
      setPos(0);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        setWrong(null);
        play();
      }, FEEDBACK_MS);
    }
  });

  return (
    <Stack align="center" gap="lg" w="100%" data-testid="echo">
      <BuddySays
        mood={playing ? 'happy' : wrong !== null ? 'think' : 'listen'}
        size={kids ? 96 : 64}
        kids={kids}
        say={t('lesson.echo.task')}
      >
        <Text fz={kids ? 26 : 22} fw={800} ta="center" aria-live="polite">
          {playing ? t('lesson.echo.listen') : t('lesson.echo.task')}
        </Text>
        <Button
          variant="light"
          leftSection={<IconEar />}
          onClick={play}
          disabled={playing}
          data-testid="echo-again"
        >
          {t('lesson.echo.again')}
        </Button>
      </BuddySays>
      <Group gap="sm" role="list" aria-label={t('lesson.notesToPlay')} data-testid="echo-notes">
        {motif.map((m, i) => (
          <span
            key={i}
            role="listitem"
            aria-label={i < pos ? midiToPitchName(m, lang) : t('lesson.echo.unknown')}
            style={{
              minWidth: kids ? 60 : 50,
              height: kids ? 60 : 50,
              borderRadius: 999,
              display: 'grid',
              placeItems: 'center',
              fontWeight: 800,
              fontSize: kids ? 24 : 20,
              background: i < pos ? 'var(--mantine-color-teal-light)' : 'var(--klavio-track)',
              color:
                i < pos ? 'var(--mantine-color-teal-light-color)' : 'var(--mantine-color-text)',
            }}
          >
            {i < pos ? <IconCheck size={20} aria-hidden /> : '?'}
          </span>
        ))}
      </Group>
      <Text size="sm" c="dimmed" mih={22}>
        {wrong !== null
          ? t('lesson.echo.wrong', { note: midiToPitchName(wrong, lang) })
          : t('lesson.part', { n: index + 1, total: exercise.motifs.length })}
      </Text>
      <VirtualKeyboard
        dock
        from={lesson.keyboard.from}
        to={lesson.keyboard.to}
        labels={lesson.keyLabels}
        height={kids ? 200 : 170}
        interactive={inputMode === 'screen'}
      />
    </Stack>
  );
}
