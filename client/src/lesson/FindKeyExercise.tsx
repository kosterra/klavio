import { Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { midiToName, midiToPitchName, type FindKeyExercise as Spec } from '@klavio/shared';
import { BuddySays } from '../components/BuddySays';
import { VirtualKeyboard } from '../components/VirtualKeyboard';
import { matchingKeys, type ExerciseProps } from './exercises';
import { useRoundTask } from './useRoundTask';
import { useNoteLang } from './useLocalized';

/** "Finde die Taste": a note name is shown; play that key on the piano. */
export function FindKeyExercise({
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
  const { from, to } = lesson.keyboard;
  const { target, round, total, wrongInRound, feedback } = useRoundTask({
    notes: exercise.notes,
    rounds: exercise.rounds,
    matches: (played, t) => (exercise.anyOctave ? played % 12 === t % 12 : played === t),
    onCorrect,
    onMistake,
    onDone,
  });

  // Help after two misses (kids: after the first).
  const showHint = wrongInRound >= (kids ? 1 : 2);
  const name = exercise.anyOctave ? midiToPitchName(target, lang) : midiToName(target, lang);

  return (
    <Stack align="center" gap="lg" w="100%">
      <BuddySays
        mood={feedback?.ok ? 'cheer' : feedback ? 'think' : 'listen'}
        size={kids ? 110 : 72}
        kids={kids}
      >
        <div aria-live="polite" aria-atomic style={{ textAlign: 'center' }}>
          <Text fz={kids ? 36 : 28} fw={800} data-testid="prompt">
            {t('lesson.findKey', { note: name })}
          </Text>
          {!exercise.anyOctave && target === 60 && <Text c="dimmed">{t('lesson.middleC')}</Text>}
          <Text mih={28} fw={700} c={feedback?.ok ? 'teal.8' : 'orange.9'}>
            {feedback?.ok
              ? t('lesson.correct')
              : feedback
                ? t('lesson.wrong', { note: midiToName(feedback.midi, lang) })
                : showHint
                  ? t('lesson.hint')
                  : ' '}
          </Text>
        </div>
      </BuddySays>
      <Text size="sm" c="dimmed">
        {t('lesson.round', { n: round + 1, total })}
      </Text>
      <div style={{ width: '100%' }}>
        <VirtualKeyboard
          from={from}
          to={to}
          labels={lesson.keyLabels}
          height={kids ? 200 : 170}
          interactive={inputMode === 'screen'}
          hints={showHint ? matchingKeys(target, exercise.anyOctave, from, to) : []}
          correct={feedback?.ok ? [feedback.midi] : []}
          wrong={feedback && !feedback.ok ? [feedback.midi] : []}
        />
      </div>
    </Stack>
  );
}
