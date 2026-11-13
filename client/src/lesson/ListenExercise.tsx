import { useEffect, useRef, useState } from 'react';
import { Button, Stack, Text } from '@mantine/core';
import { IconCheck, IconEar, IconX } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { ListenExercise as Spec } from '@klavio/shared';
import { inputHub } from '../input/noteBus';
import { playGroups, type Playback } from '../audio/synth';
import { BuddySays } from '../components/BuddySays';
import { FEEDBACK_MS, type ExerciseProps } from './exercises';
import { useLocalized } from './useLocalized';
import classes from './theory/Theory.module.css';

/**
 * «Hör genau hin»: Klavi plays something (two notes, two short melodies, a
 * chord …), the learner taps the answer. The first answer of a round counts;
 * after a wrong one the round is played again until the right answer is found.
 */
export function ListenExercise({
  exercise,
  kids,
  onCorrect,
  onMistake,
  onDone,
}: ExerciseProps<Spec>) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const [round, setRound] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [tried, setTried] = useState<number[]>([]);
  const [solved, setSolved] = useState(false);
  const playback = useRef<Playback | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const r = exercise.rounds[round]!;

  const play = () => {
    playback.current?.stop();
    const ms = (r.notes.length * 60000) / exercise.tempo;
    // the microphone would hear Klavi's notes
    inputHub.muteMicrophoneUntil(performance.now() + ms + 500);
    setPlaying(true);
    const p = playGroups(r.notes, exercise.tempo);
    playback.current = p;
    void p.done.then(() => setPlaying(false));
  };

  // every round is played by itself (the start tap was the user gesture)
  useEffect(() => {
    const id = setTimeout(play, 500);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      playback.current?.stop();
    },
    [],
  );

  const answer = (i: number) => {
    if (solved || tried.includes(i)) return;
    // only the first answer of a round is scored
    const first = tried.length === 0;
    playback.current?.stop();
    setTried((x) => [...x, i]);
    if (i !== r.answer) {
      if (first) onMistake();
      timer.current = setTimeout(play, FEEDBACK_MS);
      return;
    }
    if (first) onCorrect();
    setSolved(true);
    timer.current = setTimeout(() => {
      if (round + 1 >= exercise.rounds.length) {
        onDone();
        return;
      }
      setTried([]);
      setSolved(false);
      setRound(round + 1);
    }, FEEDBACK_MS + 300);
  };

  const wrongNow = !solved && tried.length > 0;
  return (
    <Stack align="center" gap="lg" w="100%" data-testid="listen" data-round={round}>
      <BuddySays
        mood={solved ? 'cheer' : wrongNow ? 'think' : 'listen'}
        size={kids ? 96 : 64}
        kids={kids}
        say={loc(exercise.question)}
      >
        <Text fz={kids ? 26 : 22} fw={800} ta="center" aria-live="polite">
          {solved
            ? t('lesson.ear.right')
            : wrongNow
              ? t('lesson.ear.again')
              : loc(exercise.question)}
        </Text>
        <Button
          variant="light"
          leftSection={<IconEar />}
          onClick={play}
          disabled={playing}
          data-testid="listen-again"
        >
          {t('lesson.echo.again')}
        </Button>
      </BuddySays>
      <div className={classes.answers} role="group" aria-label={loc(exercise.question)}>
        {exercise.answers.map((a, i) => {
          const wrong = tried.includes(i) && i !== r.answer;
          const right = solved && i === r.answer;
          return (
            <Button
              key={i}
              size={kids ? 'xl' : 'lg'}
              variant={right ? 'filled' : 'default'}
              color={right ? 'teal.8' : undefined}
              className={classes.answer}
              data-wrong={wrong || undefined}
              leftSection={right ? <IconCheck /> : wrong ? <IconX /> : undefined}
              disabled={(solved && !right) || wrong}
              onClick={() => answer(i)}
              data-testid={`listen-answer-${i}`}
            >
              {loc(a)}
            </Button>
          );
        })}
      </div>
      <Text size="sm" c="dimmed">
        {t('lesson.part', { n: round + 1, total: exercise.rounds.length })}
      </Text>
    </Stack>
  );
}
