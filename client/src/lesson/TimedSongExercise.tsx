import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Group, Stack, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconMetronome, IconRefresh } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { barBeats, beatsOf, type NoteEvent, type TimedSongExercise as Spec } from '@klavio/shared';
import { useNoteEvents } from '../input/noteBus';
import { runMetronome, type MetronomeRun } from '../audio/metronome';
import { BuddySays } from '../components/BuddySays';
import { VirtualKeyboard } from '../components/VirtualKeyboard';
import { Staff, type StaffNote } from '../notation/Staff';
import type { ExerciseProps } from './exercises';
import { INPUT_DELAY_MS, scoreMelody, type MelodyScore } from './rhythmScore';

type Phase = 'ready' | 'countin' | 'play' | 'result';

/** Every note with its bar and its start, in beats from the first note. */
function timeline(bars: Spec['bars']) {
  const out: (Spec['bars'][number][number] & { bar: number; at: number })[] = [];
  let beat = 0;
  bars.forEach((bar, b) => {
    for (const n of bar) {
      out.push({ ...n, bar: b, at: beat });
      beat += beatsOf(n.value);
    }
  });
  return out;
}

/** A run with this share of notes in time goes on by itself. */
const GOOD = 0.9;

/**
 * «Im Takt»: the song the learner just got to know, now in time. A bar of
 * count-in, then the metronome keeps going; the marker moves with the beat
 * and each note counts when the right key comes on time. Retries are
 * practice – only the run one continues with counts.
 */
export function TimedSongExercise({
  exercise,
  lesson,
  inputMode,
  kids,
  onCorrect,
  onMistake,
  onDone,
}: ExerciseProps<Spec>) {
  const { t } = useTranslation();
  const wide = useMediaQuery('(min-width: 900px)', true);
  const barsPerLine = wide ? 4 : 2;
  // a little slower than «Anhören»: in time is new
  const tempo = Math.round(exercise.tempo * (kids ? 0.8 : 0.9));
  const beatMs = 60000 / tempo;
  const beatsPerBar = barBeats(exercise.time);
  const tolerance = kids ? 220 : 160;

  // every note with its bar and its start (in beats from the first note)
  const notes = useMemo(() => timeline(exercise.bars), [exercise]);
  const totalBeats = exercise.bars.length * beatsPerBar;

  const [phase, setPhase] = useState<Phase>('ready');
  const [now, setNow] = useState<number | null>(null); // beats since the first note
  const [score, setScore] = useState<MelodyScore | null>(null);
  /** when the first note is due (performance.now ms) — exposed for automated tests */
  const [firstAt, setFirstAt] = useState<number | null>(null);
  const run = useRef<MetronomeRun | null>(null);
  const played = useRef<{ ms: number; midi: number }[]>([]);
  const window = useRef<{ from: number; to: number } | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const raf = useRef(0);

  const clearAll = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    cancelAnimationFrame(raf.current);
    run.current?.stop();
    run.current = null;
  };
  useEffect(() => () => clearAll(), []);

  useNoteEvents((e: NoteEvent) => {
    if (e.type !== 'note-on' || !window.current) return;
    const ms = e.time - INPUT_DELAY_MS[e.source];
    if (ms >= window.current.from && ms <= window.current.to)
      played.current.push({ ms, midi: e.midi });
  });

  const start = () => {
    clearAll();
    setScore(null);
    played.current = [];
    const accents = Array.from({ length: exercise.bars.length + 1 }, (_, i) => i * beatsPerBar);
    const m = runMetronome(beatsPerBar + totalBeats, tempo, accents);
    run.current = m;
    const first = m.beatTimes[beatsPerBar]!;
    setFirstAt(first);
    const expected = notes.map((n) => ({ ms: first + n.at * beatMs, midi: n.midi }));
    const end = first + totalBeats * beatMs;
    window.current = { from: first - beatMs / 2, to: end };
    setPhase('countin');
    const tick = () => {
      const beat = (performance.now() - first) / beatMs;
      setNow(beat);
      if (beat >= 0) setPhase((p) => (p === 'countin' ? 'play' : p));
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    timers.current.push(
      setTimeout(
        () => {
          clearAll();
          window.current = null;
          setNow(null);
          setScore(scoreMelody(expected, played.current, tolerance));
          setPhase('result');
        },
        end - performance.now() + 200,
      ),
    );
  };

  const next = () => {
    if (score) {
      const hits = score.perNote.length - score.missed;
      for (let i = 0; i < hits; i++) onCorrect();
      for (let i = 0; i < score.missed; i++) onMistake();
    }
    onDone();
  };

  const hits = score ? score.perNote.length - score.missed : 0;
  const good = !!score && hits >= Math.ceil(notes.length * GOOD);
  useEffect(() => {
    if (!good) return;
    const id = setTimeout(next, 1600);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [good]);

  // the note sounding now (by the clock), else the first one
  const current =
    now === null || now < 0
      ? 0
      : Math.max(
          0,
          notes.findIndex((n, i) => now >= n.at && now < (notes[i + 1]?.at ?? Infinity)),
        );
  const line = Math.floor(notes[current]!.bar / barsPerLine);
  const lines = Math.ceil(exercise.bars.length / barsPerLine);
  const firstBar = line * barsPerLine;
  let index = notes.findIndex((n) => n.bar === firstBar);
  const staffBars: StaffNote[][] = exercise.bars
    .slice(firstBar, firstBar + barsPerLine)
    .map((bar) =>
      bar.map((n) => {
        const i = index++;
        const verdict = score?.perNote[i];
        return {
          midi: n.midi,
          duration: n.value,
          finger: n.finger,
          state: verdict
            ? verdict === 'missed'
              ? 'wrong'
              : 'done'
            : phase === 'play' && i === current
              ? 'current'
              : undefined,
        };
      }),
    );
  const countBeat = now !== null && now < 0 ? Math.floor(now + beatsPerBar) : null;
  const hint = kids && phase === 'play' ? [notes[current]!.midi] : [];

  return (
    <Stack
      align="center"
      gap="md"
      w="100%"
      data-testid="timed-song"
      data-first-at={firstAt ?? undefined}
      data-beat-ms={beatMs}
      data-notes={JSON.stringify(notes.map((n) => [n.midi, n.at]))}
    >
      <BuddySays
        mood={good ? 'cheer' : phase === 'result' ? 'think' : 'listen'}
        size={kids ? 80 : 56}
        kids={kids}
        say={t('lesson.timed.intro')}
        classicRow
      >
        <Text fz={kids ? 24 : 20} fw={800} aria-live="polite" data-testid="timed-status">
          {phase === 'countin'
            ? t('lesson.rhythm.countIn')
            : phase === 'play'
              ? t('lesson.timed.now')
              : phase === 'result'
                ? good
                  ? t('lesson.rhythm.perfect')
                  : t('lesson.rhythm.almost')
                : t('lesson.timed.intro')}
        </Text>
      </BuddySays>

      {phase === 'countin' && countBeat !== null && (
        <Group gap="sm" aria-hidden>
          {Array.from({ length: beatsPerBar }, (_, i) => (
            <Box
              key={i}
              w={44}
              h={44}
              style={{
                borderRadius: 999,
                display: 'grid',
                placeItems: 'center',
                fontWeight: 800,
                background:
                  countBeat === i ? 'var(--mantine-color-orange-6)' : 'var(--klavio-track)',
                color: countBeat === i ? '#fff' : 'var(--mantine-color-text)',
              }}
            >
              {i + 1}
            </Box>
          ))}
        </Group>
      )}

      <div style={{ width: '100%' }}>
        <Staff
          clef={exercise.clef}
          time={line === 0 ? exercise.time : undefined}
          bars={staffBars}
          height={kids ? 200 : 170}
          label={t('lesson.songStaffLabel', { line: line + 1, lines })}
        />
      </div>

      {phase === 'result' && score && (
        <Stack gap={2} align="center" aria-live="polite" data-testid="timed-result">
          <Text fw={800}>{t('lesson.timed.hits', { count: hits, total: notes.length })}</Text>
          {!good && (
            <Text size="sm" c="dimmed" ta="center">
              {t('lesson.timed.tip')}
            </Text>
          )}
        </Stack>
      )}

      <Group>
        {(phase === 'ready' || (phase === 'result' && !good)) && (
          <>
            <Button
              size="lg"
              leftSection={phase === 'result' ? <IconRefresh /> : <IconMetronome />}
              onClick={start}
              data-testid="timed-start"
            >
              {phase === 'result' ? t('lesson.again') : t('lesson.timed.start')}
            </Button>
            {phase === 'result' && (
              <Button variant="default" size="lg" onClick={next}>
                {t('common.continue')}
              </Button>
            )}
          </>
        )}
      </Group>
      <Text size="sm" c="dimmed">
        {t('lesson.timed.tempo', { tempo })}
      </Text>

      <VirtualKeyboard
        dock
        from={lesson.keyboard.from}
        to={lesson.keyboard.to}
        labels={lesson.keyLabels}
        height={kids ? 180 : 160}
        interactive={inputMode === 'screen'}
        hints={hint}
        fingers={
          hint.length && notes[current]?.finger
            ? { [hint[0]!]: notes[current]!.finger! }
            : undefined
        }
      />
    </Stack>
  );
}
