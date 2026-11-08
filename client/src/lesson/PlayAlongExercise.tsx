import { useEffect, useRef, useState } from 'react';
import { Group, Stack, Text } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { midiToPitchName, type PlayAlongExercise as Spec } from '@klavio/shared';
import { useNoteEvents } from '../input/noteBus';
import { BuddySays } from '../components/BuddySays';
import { VirtualKeyboard } from '../components/VirtualKeyboard';
import { FEEDBACK_MS, type ExerciseProps } from './exercises';
import { useNoteLang } from './useLocalized';

/** "Spiel nach": play the shown notes in order. The app waits for each note. */
export function PlayAlongExercise({
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
  const [seqIndex, setSeqIndex] = useState(0);
  const [pos, setPos] = useState(0);
  const [wrong, setWrong] = useState<number | null>(null);
  const [missedHere, setMissedHere] = useState(false);
  const busy = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const sequence = exercise.sequences[seqIndex]!;
  const expected = sequence[pos];
  const finishedSeq = pos >= sequence.length;

  useNoteEvents((e) => {
    if (e.type !== 'note-on' || busy.current || expected === undefined) return;
    if (e.midi === expected) {
      onCorrect();
      setWrong(null);
      setMissedHere(false);
      const next = pos + 1;
      setPos(next);
      if (next >= sequence.length) {
        busy.current = true;
        timer.current = setTimeout(() => {
          busy.current = false;
          if (seqIndex + 1 >= exercise.sequences.length) onDone();
          else {
            setSeqIndex(seqIndex + 1);
            setPos(0);
          }
        }, FEEDBACK_MS * 1.4);
      }
    } else {
      onMistake();
      setMissedHere(true);
      setWrong(e.midi);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setWrong(null), FEEDBACK_MS);
    }
  });

  // Kids always see the next key; classic only after a miss.
  const hint = expected !== undefined && (kids || missedHere) ? [expected] : [];

  return (
    <Stack align="center" gap="lg" w="100%">
      <BuddySays
        mood={finishedSeq ? 'cheer' : wrong !== null ? 'think' : 'listen'}
        size={kids ? 100 : 64}
        kids={kids}
        say={t('lesson.playAlong')}
      >
        <Text fz={kids ? 28 : 22} fw={800} ta="center" aria-live="polite">
          {finishedSeq ? t('lesson.wellDone') : t('lesson.playAlong')}
        </Text>
      </BuddySays>
      <Group
        gap="sm"
        justify="center"
        role="list"
        aria-label={t('lesson.notesToPlay')}
        data-testid="sequence"
      >
        {sequence.map((m, i) => {
          const done = i < pos;
          const now = i === pos;
          return (
            <div
              key={i}
              role="listitem"
              aria-current={now ? 'step' : undefined}
              aria-label={`${midiToPitchName(m, lang)}${done ? `, ${t('lesson.played')}` : ''}`}
              style={{
                minWidth: kids ? 64 : 52,
                height: kids ? 64 : 52,
                borderRadius: 999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                fontWeight: 800,
                fontSize: kids ? 26 : 20,
                border: `3px solid ${now ? 'var(--mantine-color-orange-7)' : 'transparent'}`,
                background: done
                  ? 'var(--mantine-color-teal-light)'
                  : now
                    ? 'var(--mantine-color-orange-light)'
                    : 'var(--klavio-track)',
                color: done ? 'var(--mantine-color-teal-light-color)' : 'var(--mantine-color-text)',
              }}
            >
              {done && <IconCheck size={16} aria-hidden />}
              {midiToPitchName(m, lang)}
            </div>
          );
        })}
      </Group>
      <Text size="sm" c="dimmed" mih={22}>
        {wrong !== null
          ? t('lesson.wrongPlay', { note: midiToPitchName(wrong, lang) })
          : t('lesson.part', { n: seqIndex + 1, total: exercise.sequences.length })}
      </Text>
      <VirtualKeyboard
        dock
        from={lesson.keyboard.from}
        to={lesson.keyboard.to}
        labels={lesson.keyLabels}
        height={kids ? 200 : 170}
        interactive={inputMode === 'screen'}
        hints={hint}
        wrong={wrong !== null ? [wrong] : []}
      />
    </Stack>
  );
}
