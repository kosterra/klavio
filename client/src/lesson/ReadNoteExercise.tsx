import { Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { midiToName, midiToPitchName, type ReadNoteExercise as Spec } from '@klavio/shared';
import { Mascot } from '../components/Mascot';
import { VirtualKeyboard } from '../components/VirtualKeyboard';
import { Staff } from '../notation/Staff';
import type { ExerciseProps } from './exercises';
import { useRoundTask } from './useRoundTask';
import { useNoteLang } from './useLocalized';

/** "Notenlesen": a note on the staff; play exactly that key. */
export function ReadNoteExercise({
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
  const { target, round, total, wrongInRound, feedback } = useRoundTask({
    notes: exercise.notes,
    rounds: exercise.rounds,
    matches: (played, t) => played === t,
    onCorrect,
    onMistake,
    onDone,
  });

  // First miss: say the note's name; second (kids: first): also mark the key.
  const sayName = wrongInRound >= 1;
  const markKey = wrongInRound >= (kids ? 1 : 2);
  const clefName = t(`lesson.clef.${exercise.clef}`);

  return (
    <Stack align="center" gap="md" w="100%">
      <Mascot mood={feedback?.ok ? 'cheer' : feedback ? 'think' : 'listen'} size={kids ? 90 : 64} />
      <Text fz={kids ? 30 : 24} fw={800} ta="center">
        {t('lesson.readNote')}
      </Text>
      <div style={{ width: 'min(100%, 420px)' }}>
        <Staff
          clef={exercise.clef}
          notes={[
            {
              midi: target,
              state: feedback?.ok ? 'done' : feedback ? 'wrong' : undefined,
            },
          ]}
          height={kids ? 190 : 160}
          label={t('lesson.staffLabel', { clef: clefName })}
        />
      </div>
      <div aria-live="polite" aria-atomic style={{ textAlign: 'center' }}>
        <Text mih={28} fw={700} c={feedback?.ok ? 'teal.8' : 'orange.9'} data-testid="feedback">
          {feedback?.ok
            ? t('lesson.correctNote', { note: midiToPitchName(target, lang) })
            : feedback
              ? t('lesson.wrong', { note: midiToName(feedback.midi, lang) })
              : sayName
                ? t('lesson.itIs', { note: midiToPitchName(target, lang) })
                : ' '}
        </Text>
      </div>
      <Text size="sm" c="dimmed" data-testid="round">
        {t('lesson.round', { n: round + 1, total })}
      </Text>
      <div style={{ width: '100%' }}>
        <VirtualKeyboard
          from={lesson.keyboard.from}
          to={lesson.keyboard.to}
          labels={lesson.keyLabels}
          height={kids ? 190 : 160}
          interactive={inputMode === 'screen'}
          hints={markKey ? [target] : []}
          correct={feedback?.ok ? [feedback.midi] : []}
          wrong={feedback && !feedback.ok ? [feedback.midi] : []}
        />
      </div>
    </Stack>
  );
}
