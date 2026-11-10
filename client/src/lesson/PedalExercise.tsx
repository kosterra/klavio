import { useEffect, useRef, useState } from 'react';
import { Badge, Group, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { midiToPitchName, type PedalExercise as Spec } from '@klavio/shared';
import { useNoteEvents } from '../input/noteBus';
import { pedalState, usePedal } from '../input/pedal';
import { BuddySays } from '../components/BuddySays';
import { VirtualKeyboard } from '../components/VirtualKeyboard';
import { FEEDBACK_MS, type ExerciseProps } from './exercises';
import { useNoteLang } from './useLocalized';

/**
 * "Pedal": each note with the sustain pedal down, the pedal lifted in between
 * (after the new key – «legato pedal»). Only a digital piano reports the
 * pedal; otherwise the right key is enough.
 */
export function PedalExercise({
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
  const pedal = usePedal();
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const lastNoteAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const target = exercise.notes[index];
  const measured = inputMode === 'midi';

  const say = (text: string) => {
    setFeedback(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setFeedback(null), FEEDBACK_MS * 1.5);
  };

  useNoteEvents((e) => {
    if (e.type !== 'note-on' || target === undefined) return;
    if (e.midi !== target) {
      onMistake();
      say(t('lesson.wrongPlay', { note: midiToPitchName(e.midi, lang) }));
      return;
    }
    if (measured) {
      const p = pedalState();
      if (!p.down) {
        onMistake();
        say(t('lesson.pedal.press'));
        return;
      }
      // the pedal must have been lifted and pressed again since the last note
      if (index > 0 && p.changedAt < lastNoteAt.current) {
        onMistake();
        say(t('lesson.pedal.change'));
        return;
      }
    }
    lastNoteAt.current = e.time;
    onCorrect();
    say(t('lesson.wellDone'));
    if (index + 1 >= exercise.notes.length) timer.current = setTimeout(onDone, FEEDBACK_MS);
    else setIndex(index + 1);
  });

  return (
    <Stack align="center" gap="lg" w="100%" data-testid="pedal">
      <BuddySays
        mood={feedback === t('lesson.wellDone') ? 'cheer' : 'listen'}
        size={kids ? 96 : 64}
        kids={kids}
        say={t('lesson.pedal.task')}
      >
        <Text fz={kids ? 26 : 22} fw={800} ta="center">
          {target !== undefined
            ? t('lesson.pedal.play', { note: midiToPitchName(target, lang) })
            : ''}
        </Text>
      </BuddySays>
      <Group gap="sm">
        <Text size="sm">
          {t('lesson.pedal.step', { n: index + 1, total: exercise.notes.length })}
        </Text>
        {measured && (
          <Badge
            color={pedal ? 'teal' : 'gray'}
            variant="light"
            size="lg"
            data-testid="pedal-state"
          >
            {pedal ? t('lesson.pedal.down') : t('lesson.pedal.up')}
          </Badge>
        )}
      </Group>
      <Text size="sm" c="dimmed" mih={22} ta="center" aria-live="polite">
        {feedback ?? (measured ? t('lesson.pedal.task') : t('lesson.pedal.notMeasured'))}
      </Text>
      <VirtualKeyboard
        dock
        from={lesson.keyboard.from}
        to={lesson.keyboard.to}
        labels={lesson.keyLabels}
        height={kids ? 200 : 170}
        interactive={inputMode === 'screen'}
        hints={target !== undefined ? [target] : []}
      />
    </Stack>
  );
}
