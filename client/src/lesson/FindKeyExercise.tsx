import { useEffect, useRef, useState } from 'react';
import { Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { midiToName, midiToPitchName, type FindKeyExercise as Spec } from '@klavio/shared';
import { useNoteEvents } from '../input/noteBus';
import { Mascot } from '../components/Mascot';
import { VirtualKeyboard } from '../components/VirtualKeyboard';
import { FEEDBACK_MS, matchingKeys, shuffleRounds, type ExerciseProps } from './exercises';
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
  const [targets] = useState(() => shuffleRounds(exercise.notes, exercise.rounds));
  const [round, setRound] = useState(0);
  const [wrongInRound, setWrongInRound] = useState(0);
  const [feedback, setFeedback] = useState<{ midi: number; ok: boolean } | null>(null);
  const busy = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const target = targets[round]!;
  const { from, to } = lesson.keyboard;
  const matches = (midi: number) =>
    exercise.anyOctave ? midi % 12 === target % 12 : midi === target;

  useNoteEvents((e) => {
    if (e.type !== 'note-on' || busy.current) return;
    if (matches(e.midi)) {
      busy.current = true;
      setFeedback({ midi: e.midi, ok: true });
      onCorrect();
      timer.current = setTimeout(() => {
        busy.current = false;
        setFeedback(null);
        setWrongInRound(0);
        if (round + 1 >= targets.length) onDone();
        else setRound(round + 1);
      }, FEEDBACK_MS);
    } else {
      onMistake();
      setWrongInRound((w) => w + 1);
      setFeedback({ midi: e.midi, ok: false });
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setFeedback(null), FEEDBACK_MS);
    }
  });

  // Help after two misses (kids: after the first).
  const showHint = wrongInRound >= (kids ? 1 : 2);
  const name = exercise.anyOctave ? midiToPitchName(target, lang) : midiToName(target, lang);

  return (
    <Stack align="center" gap="lg" w="100%">
      <Mascot
        mood={feedback?.ok ? 'cheer' : feedback ? 'think' : 'listen'}
        size={kids ? 110 : 72}
      />
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
      <Text size="sm" c="dimmed">
        {t('lesson.round', { n: round + 1, total: targets.length })}
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
