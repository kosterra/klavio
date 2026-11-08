import { useEffect, useRef, useState } from 'react';
import { Group, Stack, Text } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { midiToPitchName, type ChordsExercise as Spec } from '@klavio/shared';
import { useNoteEvents } from '../input/noteBus';
import { BuddySays } from '../components/BuddySays';
import { VirtualKeyboard } from '../components/VirtualKeyboard';
import { FEEDBACK_MS, type ExerciseProps } from './exercises';
import { useNoteLang } from './useLocalized';

/**
 * "Akkorde": one chord after the other. With a digital piano all notes of the
 * chord have to sound together; with the microphone (one note at a time) or
 * the screen keys one note of the chord is enough – the hand learns the shape
 * either way.
 */
export function ChordsExercise({
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
  const [wrong, setWrong] = useState<number | null>(null);
  const [solved, setSolved] = useState(false);
  const held = useRef(new Set<number>());
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const chord = exercise.chords[index];
  const all = inputMode === 'midi';

  const advance = () => {
    onCorrect();
    setSolved(true);
    timer.current = setTimeout(() => {
      setSolved(false);
      held.current.clear();
      if (index + 1 >= exercise.chords.length) onDone();
      else setIndex(index + 1);
    }, FEEDBACK_MS);
  };

  useNoteEvents((e) => {
    if (!chord || solved) return;
    if (e.type === 'note-off') {
      held.current.delete(e.midi);
      return;
    }
    if (!chord.includes(e.midi)) {
      onMistake();
      setWrong(e.midi);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setWrong(null), FEEDBACK_MS);
      return;
    }
    held.current.add(e.midi);
    if (!all || chord.every((m) => held.current.has(m))) advance();
  });

  const names = chord?.map((m) => midiToPitchName(m, lang)).join(' – ');
  return (
    <Stack align="center" gap="lg" w="100%" data-testid="chords">
      <BuddySays
        mood={solved ? 'cheer' : wrong !== null ? 'think' : 'listen'}
        size={kids ? 96 : 64}
        kids={kids}
        say={t('lesson.chords.task', { name: exercise.names[index] })}
      >
        <Text fz={kids ? 30 : 24} fw={800} ta="center" aria-live="polite">
          {solved ? t('lesson.wellDone') : t('lesson.chords.task', { name: exercise.names[index] })}
        </Text>
        <Text fw={700} c="dimmed" ta="center">
          {names}
        </Text>
      </BuddySays>
      <Group gap="sm" aria-hidden>
        {exercise.names.map((n, i) => (
          <span
            key={i}
            style={{
              minWidth: 52,
              height: 52,
              borderRadius: 999,
              display: 'grid',
              placeItems: 'center',
              fontWeight: 900,
              fontSize: 22,
              border: `3px solid ${i === index ? 'var(--mantine-color-orange-7)' : 'transparent'}`,
              background:
                i < index
                  ? 'var(--mantine-color-teal-light)'
                  : i === index
                    ? 'var(--mantine-color-orange-light)'
                    : 'var(--klavio-track)',
            }}
          >
            {i < index ? <IconCheck size={20} /> : n}
          </span>
        ))}
      </Group>
      <Text size="sm" c="dimmed" mih={22} ta="center">
        {wrong !== null
          ? t('lesson.wrongPlay', { note: midiToPitchName(wrong, lang) })
          : all
            ? t('lesson.chords.together')
            : t('lesson.chords.oneEnough')}
      </Text>
      <VirtualKeyboard
        dock
        from={lesson.keyboard.from}
        to={lesson.keyboard.to}
        labels={lesson.keyLabels}
        height={kids ? 200 : 170}
        interactive={inputMode === 'screen'}
        hints={chord ?? []}
        fingers={
          chord && exercise.fingers?.[index]
            ? Object.fromEntries(chord.map((m, i) => [m, exercise.fingers![index]![i]!]))
            : undefined
        }
        wrong={wrong !== null ? [wrong] : []}
      />
    </Stack>
  );
}
