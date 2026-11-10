import { useEffect, useRef } from 'react';
import { Button } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { NoteRainExercise as Spec } from '@klavio/shared';
import type { ExerciseProps } from './exercises';
import { NoteRainGame } from './NoteRainGame';

/**
 * «Notenregen» as a lesson exercise: catch {@link Spec.goal} notes. Only the
 * finished round counts – a new try starts fresh; «Weiter» after three
 * landed notes counts what was caught.
 */
export function NoteRainExercise({
  exercise,
  lesson,
  inputMode,
  kids,
  onCorrect,
  onMistake,
  onDone,
}: ExerciseProps<Spec>) {
  const { t } = useTranslation();
  const doneTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(doneTimer.current), []);

  return (
    <NoteRainGame
      clef={exercise.clef}
      notes={exercise.notes}
      goal={exercise.goal}
      fall={exercise.fall}
      kids={kids}
      keyboard={lesson.keyboard}
      labels={lesson.keyLabels}
      interactive={inputMode === 'screen'}
      onWon={({ misses }) => {
        for (let i = 0; i < exercise.goal; i++) onCorrect();
        for (let i = 0; i < misses; i++) onMistake();
        doneTimer.current = setTimeout(onDone, 1400);
      }}
      overActions={({ caught }) => (
        <Button
          size="lg"
          variant="default"
          onClick={() => {
            // what was caught counts, the rest as missed
            for (let i = 0; i < caught; i++) onCorrect();
            for (let i = 0; i < exercise.goal - caught; i++) onMistake();
            onDone();
          }}
        >
          {t('common.continue')}
        </Button>
      )}
    />
  );
}
