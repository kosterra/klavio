import { useEffect, useRef, useState } from 'react';
import { Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { midiToPitchName, type DynamicsExercise as Spec } from '@klavio/shared';
import { useNoteEvents } from '../input/noteBus';
import { BuddySays } from '../components/BuddySays';
import { VirtualKeyboard } from '../components/VirtualKeyboard';
import { FEEDBACK_MS, type ExerciseProps } from './exercises';
import { useNoteLang } from './useLocalized';

/** From this key velocity on a note counts as loud, up to this one as soft (MIDI, 0–1). */
const LOUD = 0.6;
const SOFT = 0.45;

/**
 * "Laut und leise": one note at a time, loud (f) or soft (p). A digital piano
 * reports how hard the key was struck; with the microphone or the screen keys
 * the right key is enough – the lesson never gets stuck on it.
 */
export function DynamicsExercise({
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
  const [feedback, setFeedback] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const task = exercise.tasks[index];
  const measured = inputMode === 'midi';

  const say = (text: string) => {
    setFeedback(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setFeedback(null), FEEDBACK_MS * 1.5);
  };

  useNoteEvents((e) => {
    if (e.type !== 'note-on' || !task) return;
    if (e.midi !== task.midi) {
      onMistake();
      say(t('lesson.wrongPlay', { note: midiToPitchName(e.midi, lang) }));
      return;
    }
    if (measured && task.level === 'f' && e.velocity < LOUD) {
      onMistake();
      say(t('lesson.dynamics.louder'));
      return;
    }
    if (measured && task.level === 'p' && e.velocity > SOFT) {
      onMistake();
      say(t('lesson.dynamics.softer'));
      return;
    }
    onCorrect();
    say(t('lesson.wellDone'));
    if (index + 1 >= exercise.tasks.length) timer.current = setTimeout(onDone, FEEDBACK_MS);
    else setIndex(index + 1);
  });

  return (
    <Stack align="center" gap="lg" w="100%" data-testid="dynamics">
      <BuddySays
        mood={feedback === t('lesson.wellDone') ? 'cheer' : 'listen'}
        size={kids ? 96 : 64}
        kids={kids}
        say={
          task ? t(`lesson.dynamics.${task.level}`, { note: midiToPitchName(task.midi, lang) }) : ''
        }
      >
        {task && (
          <Text fz={kids ? 28 : 22} fw={800} ta="center" aria-live="polite">
            <span
              style={{
                fontFamily: 'serif',
                fontStyle: 'italic',
                fontSize: '1.4em',
                marginRight: 10,
              }}
            >
              {task.level}
            </span>
            {t(`lesson.dynamics.${task.level}`, { note: midiToPitchName(task.midi, lang) })}
          </Text>
        )}
      </BuddySays>
      <Text size="sm" c="dimmed" mih={22} ta="center" aria-live="polite">
        {feedback ?? (measured ? t('lesson.dynamics.measured') : t('lesson.dynamics.notMeasured'))}
      </Text>
      <VirtualKeyboard
        dock
        from={lesson.keyboard.from}
        to={lesson.keyboard.to}
        labels={lesson.keyLabels}
        height={kids ? 200 : 170}
        interactive={inputMode === 'screen'}
        hints={task ? [task.midi] : []}
      />
    </Stack>
  );
}
