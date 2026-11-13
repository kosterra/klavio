import { useEffect, useMemo, useRef, useState } from 'react';
import { fitBarsPerLine } from '../notation/lineLength';
import {
  Button,
  Group,
  RangeSlider,
  SegmentedControl,
  Stack,
  Text,
  VisuallyHidden,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconPlayerPlay, IconPlayerStop } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import {
  beatsOf,
  midiToPitchName,
  pieceFingers,
  pieceSteps,
  type PieceExercise as Spec,
} from '@klavio/shared';
import { inputHub, useNoteEvents } from '../input/noteBus';
import { playMelody, type Playback } from '../audio/synth';
import { BuddySays } from '../components/BuddySays';
import { VirtualKeyboard } from '../components/VirtualKeyboard';
import { GrandStaff } from '../notation/GrandStaff';
import type { StaffNote } from '../notation/Staff';
import { FEEDBACK_MS, type ExerciseProps } from './exercises';
import { useNoteLang } from './useLocalized';

type Hands = 'both' | 'rh' | 'lh';

/**
 * "Stück für beide Hände" in "wait for me" mode on the grand staff. A step is
 * every moment where notes start; it is done when its notes were played –
 * with the microphone (one note at a time) the leading note is enough.
 *
 * Practising: one hand alone and/or only some bars, over and over. Such a
 * round does not count for the lesson (no stars, it goes round in a loop) –
 * the lesson is done with both hands and all bars.
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
  const barsPerLine = fitBarsPerLine(
    wide ? 3 : 2,
    exercise.bars.map((b) => Math.max(b.rh.length, b.lh.length)),
  );
  const steps = useMemo(() => pieceSteps(exercise), [exercise]);
  const fingers = useMemo(() => pieceFingers(exercise), [exercise]);
  // which step each note belongs to (for highlighting)
  const stepOf = useMemo(() => {
    const m = new Map<string, number>();
    steps.forEach((s, i) => {
      if (s.rhIndex !== null) m.set(`${s.bar}-rh-${s.rhIndex}`, i);
      if (s.lhIndex !== null) m.set(`${s.bar}-lh-${s.lhIndex}`, i);
    });
    return m;
  }, [steps]);

  const lastBar = exercise.bars.length - 1;
  const [hands, setHands] = useState<Hands>('both');
  const [range, setRange] = useState<[number, number]>([0, lastBar]);
  const [rangeDraft, setRangeDraft] = useState<[number, number]>([0, lastBar]);
  const [loops, setLoops] = useState(0);
  const practising = hands !== 'both' || range[0] > 0 || range[1] < lastBar;
  // the steps of this round, in order (indices into `steps`)
  const order = useMemo(
    () =>
      steps
        .map((_, i) => i)
        .filter((i) => {
          const s = steps[i]!;
          if (s.bar < range[0] || s.bar > range[1]) return false;
          return hands === 'both' || (hands === 'rh' ? s.rh !== null : s.lh !== null);
        }),
    [steps, hands, range],
  );
  const posOf = useMemo(() => new Map(order.map((i, k) => [i, k])), [order]);

  const [pos, setPos] = useState(0);
  const [got, setGot] = useState<number[]>([]);
  const [wrong, setWrong] = useState<number | null>(null);
  const [missedHere, setMissedHere] = useState(false);
  const [listening, setListening] = useState(false);
  const playback = useRef<Playback[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const empty = order.length === 0;
  const finished = empty || pos >= order.length;
  const step = steps[order[Math.min(pos, order.length - 1)] ?? 0]!;
  // one hand practised: only its note; the microphone hears one note at a time:
  // then the melody (or the only note) counts
  const required = finished
    ? []
    : hands === 'rh'
      ? [step.rh!]
      : hands === 'lh'
        ? [step.lh!]
        : inputMode === 'microphone'
          ? [step.rh ?? step.lh!]
          : [step.rh, step.lh].filter((m): m is number => m !== null);

  /** a new practice choice starts the round again */
  const restart = () => {
    clearTimeout(timer.current);
    setPos(0);
    setGot([]);
    setWrong(null);
    setMissedHere(false);
    setLoops(0);
  };
  const changeHands = (h: Hands) => {
    setHands(h);
    restart();
  };
  const changeRange = (r: [number, number]) => {
    setRange(r);
    setRangeDraft(r);
    restart();
  };

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
    const previous = pos > 0 ? steps[order[pos - 1]!] : undefined;
    if (required.includes(e.midi)) {
      if (got.includes(e.midi)) return;
      const now = [...got, e.midi];
      if (required.every((m) => now.includes(m))) {
        if (!practising) onCorrect();
        setGot([]);
        setWrong(null);
        setMissedHere(false);
        const next = pos + 1;
        setPos(next);
        if (next >= order.length) {
          if (practising) {
            // a practice round: again from the start of the chosen bars
            setLoops((l) => l + 1);
            timer.current = setTimeout(() => setPos(0), FEEDBACK_MS * 1.5);
          } else timer.current = setTimeout(onDone, FEEDBACK_MS * 1.5);
        }
      } else {
        setGot(now);
      }
    } else if (previous && (e.midi === previous.rh || e.midi === previous.lh)) {
      return;
    } else if (
      (inputMode === 'microphone' || hands !== 'both') &&
      (e.midi === step.lh || e.midi === step.rh)
    ) {
      return; // the other hand's note of this step – fine, not needed
    } else {
      if (!practising) onMistake(step.rh ?? step.lh ?? undefined);
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
    // what is practised is what one hears: the chosen bars, the chosen hand
    const part = (hand: 'rh' | 'lh') =>
      exercise.bars.slice(range[0], range[1] + 1).flatMap((b) =>
        b[hand].map((n) => ({
          midi: hands === 'both' || hands === hand ? (n.midi ?? -1) : -1,
          beats: beatsOf(n.value),
        })),
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
    const k = i === undefined ? undefined : posOf.get(i);
    if (k === undefined || listening) return undefined;
    if (k < pos) return 'done';
    if (k === pos) return wrong !== null ? 'wrong' : 'current';
    return undefined;
  };
  const toStaff = (b: number, hand: 'rh' | 'lh') =>
    exercise.bars[b]![hand].map((n, i): StaffNote => ({
      midi: n.midi ?? 60,
      duration: n.value,
      label: exercise.showNames && n.midi !== null ? midiToPitchName(n.midi, lang) : undefined,
      finger: fingers[b]![hand][i],
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
            ? practising
              ? t('piece.roundDone')
              : t('lesson.wellDone')
            : listening
              ? t('lesson.listening')
              : t('lesson.playPiece')}
        </Text>
        <Button
          variant="light"
          leftSection={listening ? <IconPlayerStop /> : <IconPlayerPlay />}
          onClick={listen}
          disabled={finished && !practising}
        >
          {listening ? t('lesson.stopListening') : t('lesson.listen')}
        </Button>
      </BuddySays>

      {/* practising: one hand alone, only some bars – round and round */}
      <Group gap="md" wrap="wrap" justify="center" w="100%" data-testid="piece-practice">
        <SegmentedControl
          aria-label={t('piece.hands')}
          value={hands}
          onChange={(v) => changeHands(v as Hands)}
          data={[
            { value: 'both', label: t('piece.both') },
            { value: 'rh', label: t('piece.right') },
            { value: 'lh', label: t('piece.left') },
          ]}
        />
        {exercise.bars.length > 2 && (
          <div style={{ flex: 1, minWidth: 200, maxWidth: 360 }}>
            <Text size="sm" fw={700} mb={4} id="piece-bars">
              {t('piece.bars', { from: rangeDraft[0] + 1, to: rangeDraft[1] + 1 })}
            </Text>
            <RangeSlider
              min={0}
              max={lastBar}
              step={1}
              minRange={0}
              value={rangeDraft}
              onChange={setRangeDraft}
              onChangeEnd={changeRange}
              label={(v) => v + 1}
              thumbFromLabel={t('piece.barFrom')}
              thumbToLabel={t('piece.barTo')}
              aria-labelledby="piece-bars"
            />
          </div>
        )}
      </Group>
      {practising && (
        <Text size="sm" fw={600} ta="center" data-testid="piece-practising">
          {t('piece.practising')}
          {loops > 0 && ` · ${t('piece.loops', { count: loops })}`}
        </Text>
      )}
      {empty && (
        <Text size="sm" ta="center">
          {t('piece.nothingHere')}
        </Text>
      )}

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
            ? t('lesson.songProgress', { n: pos + 1, total: order.length })
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
