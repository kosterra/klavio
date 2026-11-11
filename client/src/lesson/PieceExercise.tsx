import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Stack, Text, VisuallyHidden } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconPlayerPlay, IconPlayerStop } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { beatsOf, midiToPitchName, pieceSteps, type PieceExercise as Spec } from '@klavio/shared';
import { inputHub, useNoteEvents } from '../input/noteBus';
import { playMelody, type Playback } from '../audio/synth';
import { BuddySays } from '../components/BuddySays';
import { VirtualKeyboard } from '../components/VirtualKeyboard';
import { GrandStaff } from '../notation/GrandStaff';
import type { StaffNote } from '../notation/Staff';
import { FEEDBACK_MS, type ExerciseProps } from './exercises';
import { useNoteLang } from './useLocalized';

/**
 * "Stück für beide Hände" in "wait for me" mode on the grand staff. A step is
 * every moment where notes start; it is done when its notes were played –
 * with the microphone (one note at a time) the leading note is enough.
 */
export function PieceExercise({
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
  const wide = useMediaQuery('(min-width: 900px)', true);
  const barsPerLine = wide ? 3 : 2;
  const steps = useMemo(() => pieceSteps(exercise), [exercise]);
  // which step each note belongs to (for highlighting)
  const stepOf = useMemo(() => {
    const m = new Map<string, number>();
    steps.forEach((s, i) => {
      if (s.rhIndex !== null) m.set(`${s.bar}-rh-${s.rhIndex}`, i);
      if (s.lhIndex !== null) m.set(`${s.bar}-lh-${s.lhIndex}`, i);
    });
    return m;
  }, [steps]);

  const [pos, setPos] = useState(0);
  const [got, setGot] = useState<number[]>([]);
  const [wrong, setWrong] = useState<number | null>(null);
  const [missedHere, setMissedHere] = useState(false);
  const [listening, setListening] = useState(false);
  const playback = useRef<Playback[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const finished = pos >= steps.length;
  const step = steps[Math.min(pos, steps.length - 1)]!;
  // the microphone hears one note at a time: then the melody (or the only note) counts
  const required = finished
    ? []
    : inputMode === 'microphone'
      ? [step.rh ?? step.lh!]
      : [step.rh, step.lh].filter((m): m is number => m !== null);

  useEffect(
    () => () => {
      clearTimeout(timer.current);
      playback.current.forEach((p) => p.stop());
      inputHub.muteMicrophoneUntil(0);
    },
    [],
  );

  useNoteEvents((e) => {
    if (e.type !== 'note-on' || finished || listening) return;
    // notes of the step just finished may still sound / be repeated: ignore them
    const previous = steps[pos - 1];
    if (required.includes(e.midi)) {
      if (got.includes(e.midi)) return;
      const now = [...got, e.midi];
      if (required.every((m) => now.includes(m))) {
        onCorrect();
        setGot([]);
        setWrong(null);
        setMissedHere(false);
        const next = pos + 1;
        setPos(next);
        if (next >= steps.length) timer.current = setTimeout(onDone, FEEDBACK_MS * 1.5);
      } else {
        setGot(now);
      }
    } else if (previous && (e.midi === previous.rh || e.midi === previous.lh)) {
      return;
    } else if (inputMode === 'microphone' && (e.midi === step.lh || e.midi === step.rh)) {
      return; // the other hand's note of this step – fine, not needed
    } else {
      onMistake(step.rh ?? step.lh ?? undefined);
      setMissedHere(true);
      setWrong(e.midi);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setWrong(null), FEEDBACK_MS);
    }
  });

  const listen = () => {
    if (listening) {
      playback.current.forEach((p) => p.stop());
      return;
    }
    const part = (hand: 'rh' | 'lh') =>
      exercise.bars.flatMap((b) =>
        b[hand].map((n) => ({ midi: n.midi ?? -1, beats: beatsOf(n.value) })),
      );
    const rh = part('rh');
    const ms = (rh.reduce((s, n) => s + n.beats, 0) * 60000) / exercise.tempo;
    inputHub.muteMicrophoneUntil(performance.now() + ms + 800);
    setListening(true);
    playback.current = [playMelody(rh, exercise.tempo), playMelody(part('lh'), exercise.tempo)];
    void Promise.all(playback.current.map((p) => p.done)).then(() => {
      playback.current = [];
      setListening(false);
      inputHub.muteMicrophoneUntil(performance.now() + 500);
    });
  };

  // the line of bars that contains the current step
  const line = Math.floor(step.bar / barsPerLine);
  const lines = Math.ceil(exercise.bars.length / barsPerLine);
  const firstBar = line * barsPerLine;
  const stateOf = (key: string): StaffNote['state'] => {
    const i = stepOf.get(key);
    if (i === undefined || listening) return undefined;
    if (i < pos) return 'done';
    if (i === pos) return wrong !== null ? 'wrong' : 'current';
    return undefined;
  };
  const toStaff = (b: number, hand: 'rh' | 'lh') =>
    exercise.bars[b]![hand].map((n, i): StaffNote => ({
      midi: n.midi ?? 60,
      duration: n.midi === null ? n.value : n.value,
      label: exercise.showNames && n.midi !== null ? midiToPitchName(n.midi, lang) : undefined,
      state: n.midi === null ? undefined : stateOf(`${b}-${hand}-${i}`),
    }));
  const staffBars = exercise.bars
    .slice(firstBar, firstBar + barsPerLine)
    .map((_, k) => ({ rh: toStaff(firstBar + k, 'rh'), lh: toStaff(firstBar + k, 'lh') }));

  const open = required.filter((m) => !got.includes(m));
  const hint = !listening && (kids || missedHere) ? open : [];
  const names = (ms: number[]) => ms.map((m) => midiToPitchName(m, lang)).join(' + ');

  return (
    <Stack align="center" gap="md" w="100%">
      <BuddySays
        mood={finished ? 'cheer' : listening ? 'happy' : wrong !== null ? 'think' : 'listen'}
        size={kids ? 80 : 56}
        kids={kids}
        say={t('lesson.playPiece')}
        classicRow
      >
        <Text fz={kids ? 26 : 22} fw={800} aria-live="polite">
          {finished
            ? t('lesson.wellDone')
            : listening
              ? t('lesson.listening')
              : t('lesson.playPiece')}
        </Text>
        <Button
          variant="light"
          leftSection={listening ? <IconPlayerStop /> : <IconPlayerPlay />}
          onClick={listen}
          disabled={finished}
        >
          {listening ? t('lesson.stopListening') : t('lesson.listen')}
        </Button>
      </BuddySays>

      <div style={{ width: '100%' }} data-testid="piece-staff">
        <GrandStaff
          time={line === 0 ? exercise.time : undefined}
          bars={staffBars}
          height={kids ? 270 : 240}
          label={t('lesson.songStaffLabel', { line: line + 1, lines })}
        />
      </div>
      <Text size="sm" c="dimmed" mih={22} data-testid="piece-status">
        {wrong !== null
          ? t('lesson.wrongPlay', { note: midiToPitchName(wrong, lang) })
          : !finished
            ? t('lesson.songProgress', { n: pos + 1, total: steps.length })
            : ' '}
      </Text>
      {inputMode === 'microphone' && step.rh !== null && step.lh !== null && !finished && (
        <Text size="sm" fw={600}>
          {t('lesson.micMelodyOnly')}
        </Text>
      )}
      <VisuallyHidden aria-live="polite" data-testid="next-note">
        {!finished ? t('lesson.nextNote', { note: names(open.length ? open : required) }) : ''}
      </VisuallyHidden>
      <VirtualKeyboard
        dock
        from={lesson.keyboard.from}
        to={lesson.keyboard.to}
        labels={lesson.keyLabels}
        height={kids ? 170 : 150}
        interactive={inputMode === 'screen'}
        hints={hint}
        correct={got}
        wrong={wrong !== null ? [wrong] : []}
      />
    </Stack>
  );
}
