import { useState } from 'react';
import { Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import {
  sightMelody,
  type SightReadExercise as Spec,
  type TimedSongExercise as TimedSpec,
} from '@klavio/shared';
import type { ExerciseProps } from './exercises';
import { TimedSongExercise } from './TimedSongExercise';

/**
 * «Vom Blatt spielen»: a few short melodies, each one new – made up from the
 * keys and rhythms of the exercise – and played in time at first sight: no
 * listening first, no marked keys, no finger numbers.
 */
export function SightReadExercise(props: ExerciseProps<Spec>) {
  const { exercise, onDone } = props;
  const { t } = useTranslation();
  // all melodies of the lesson, made once: a retry plays the same one again
  const [melodies] = useState(() =>
    Array.from({ length: exercise.rounds }, () => sightMelody(exercise)),
  );
  const [round, setRound] = useState(0);
  const spec: TimedSpec = {
    type: 'song-timed',
    clef: exercise.clef,
    time: exercise.time,
    tempo: exercise.tempo,
    showNames: false,
    bars: melodies[round]!,
  };
  return (
    <Stack align="center" gap="xs" w="100%" data-testid="sight-read" data-round={round}>
      <Text size="sm" fw={700} c="dimmed">
        {t('lesson.sight.round', { n: round + 1, total: exercise.rounds })}
      </Text>
      <TimedSongExercise
        key={round}
        {...props}
        exercise={spec}
        sight
        onDone={() => (round + 1 >= exercise.rounds ? onDone() : setRound(round + 1))}
      />
    </Stack>
  );
}
