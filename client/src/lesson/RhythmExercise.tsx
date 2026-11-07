import { useEffect, useRef, useState } from 'react';
import { Box, Button, Group, Stack, Text } from '@mantine/core';
import { IconPlayerPlay, IconRefresh } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import {
  barBeats,
  beatsOf,
  isRest,
  rhythmOnsets,
  type NoteEvent,
  type RhythmExercise as Spec,
} from '@klavio/shared';
import { inputHub, useNoteEvents } from '../input/noteBus';
import { runMetronome, type MetronomeRun } from '../audio/metronome';
import { playNote } from '../audio/synth';
import { Buddy } from '../components/Buddy';
import { VirtualKeyboard } from '../components/VirtualKeyboard';
import { Staff, type StaffNote } from '../notation/Staff';
import type { ExerciseProps } from './exercises';
import { INPUT_DELAY_MS, scoreRhythm, type RhythmScore } from './rhythmScore';

type Phase = 'ready' | 'countin' | 'play' | 'result' | 'listen';

/** Current time on the clock NoteEvents use (only called from handlers/timers). */
const clockMs = () => performance.now();

/**
 * "Rhythmus": one bar of rhythm; a bar of count-in clicks, then the learner
 * plays along on any key while the metronome keeps going.
 */
export function RhythmExercise({
  exercise,
  lesson,
  inputMode,
  kids,
  onCorrect,
  onMistake,
  onDone,
}: ExerciseProps<Spec>) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('ready');
  const [beat, setBeat] = useState<number | null>(null);
  const [score, setScore] = useState<RhythmScore | null>(null);
  /** When the bar to play starts (performance.now ms) — exposed for automated tests. */
  const [playStartAt, setPlayStartAt] = useState<number | null>(null);
  const run = useRef<MetronomeRun | null>(null);
  const played = useRef<number[]>([]);
  const window = useRef<{ from: number; to: number } | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const raf = useRef(0);

  const pattern = exercise.patterns[index]!;
  const beatsPerBar = barBeats(exercise.time);
  const beatMs = 60000 / exercise.tempo;
  const onsets = rhythmOnsets(pattern);
  const tolerance = kids ? 150 : 100;

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
    const time = e.time - INPUT_DELAY_MS[e.source];
    if (time >= window.current.from && time <= window.current.to) played.current.push(time);
  });

  /** Animate the beat indicator along the metronome's beat times. */
  const follow = (beatTimes: number[]) => {
    const tick = () => {
      const now = clockMs();
      let b: number | null = null;
      for (let i = 0; i < beatTimes.length; i++) if (now >= beatTimes[i]!) b = i;
      setBeat(b);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  const start = () => {
    clearAll();
    setScore(null);
    played.current = [];
    // bar 1: count-in, bar 2: the learner plays
    const m = runMetronome(beatsPerBar * 2, exercise.tempo, [0, beatsPerBar]);
    run.current = m;
    const playStart = m.beatTimes[beatsPerBar]!;
    setPlayStartAt(playStart);
    const expected = onsets.map((o) => playStart + o * beatMs);
    const end = playStart + beatsPerBar * beatMs;
    window.current = { from: playStart - beatMs / 2, to: end - beatMs / 3 };
    setPhase('countin');
    follow(m.beatTimes);
    const now = clockMs();
    timers.current.push(
      setTimeout(() => setPhase('play'), playStart - now - beatMs / 2),
      setTimeout(
        () => {
          clearAll();
          window.current = null;
          setBeat(null);
          setScore(scoreRhythm(expected, played.current, tolerance));
          setPhase('result');
        },
        end - now + 150,
      ),
    );
  };

  const listen = () => {
    clearAll();
    setPhase('listen');
    const m = runMetronome(beatsPerBar, exercise.tempo, [0]);
    run.current = m;
    inputHub.muteMicrophoneUntil(m.beatTimes[0]! + beatsPerBar * beatMs + 600);
    follow(m.beatTimes);
    const now = clockMs();
    let t = 0;
    for (const v of pattern) {
      const at = m.beatTimes[0]! + t * beatMs - now;
      if (!isRest(v)) {
        const len = beatsOf(v) * beatMs * 0.85;
        timers.current.push(
          setTimeout(() => {
            const voice = playNote(exercise.midi, 0.6);
            timers.current.push(setTimeout(() => voice?.release(), len));
          }, at),
        );
      }
      t += beatsOf(v);
    }
    timers.current.push(
      setTimeout(
        () => {
          clearAll();
          setBeat(null);
          setPhase('ready');
        },
        m.beatTimes[0]! + beatsPerBar * beatMs - now + 200,
      ),
    );
  };

  const next = () => {
    // only the attempt the learner continues with counts (retries are practice)
    if (score) {
      const hits = score.perNote.length - score.missed;
      for (let i = 0; i < hits; i++) onCorrect();
      for (let i = 0; i < score.missed + score.extra; i++) onMistake();
    }
    setScore(null);
    setPhase('ready');
    if (index + 1 >= exercise.patterns.length) onDone();
    else setIndex(index + 1);
  };

  const perfect = score && score.missed === 0 && score.extra === 0;
  useEffect(() => {
    if (!perfect) return;
    const id = setTimeout(next, 1400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perfect]);

  // beat position of every value, and the index among played (non-rest) notes
  const starts = pattern.map((_, i) => pattern.slice(0, i).reduce((n, v) => n + beatsOf(v), 0));
  const noteIndexOf = pattern.map((_, i) => pattern.slice(0, i).filter((v) => !isRest(v)).length);
  const staffNotes: StaffNote[] = pattern.map((v, i) => {
    const rest = isRest(v);
    const verdict = !rest && score ? score.perNote[noteIndexOf[i]!] : undefined;
    return {
      midi: exercise.midi,
      duration: v,
      label: rest ? undefined : String(Math.floor(starts[i]!) + 1),
      state:
        verdict === 'ok'
          ? 'done'
          : verdict === 'missed'
            ? 'wrong'
            : verdict
              ? 'current'
              : undefined,
    };
  });

  const counting = phase === 'countin' || phase === 'play' || phase === 'listen';
  const shownBeat = beat === null ? null : beat % beatsPerBar;
  const verdictText = (v: string) => t(`lesson.rhythm.${v}`);

  return (
    <Stack
      align="center"
      gap="md"
      w="100%"
      data-testid="rhythm"
      data-play-start={playStartAt ?? undefined}
      data-beat-ms={beatMs}
    >
      <Group gap="md" wrap="nowrap" justify="center">
        <Buddy
          mood={perfect ? 'cheer' : phase === 'result' ? 'think' : 'listen'}
          size={kids ? 80 : 56}
        />
        <Text fz={kids ? 26 : 22} fw={800} aria-live="polite" data-testid="rhythm-status">
          {phase === 'countin'
            ? t('lesson.rhythm.countIn')
            : phase === 'play'
              ? t('lesson.rhythm.now')
              : phase === 'listen'
                ? t('lesson.listening')
                : phase === 'result'
                  ? perfect
                    ? t('lesson.rhythm.perfect')
                    : t('lesson.rhythm.almost')
                  : t('lesson.rhythm.ready')}
        </Text>
      </Group>

      <Group gap="sm" aria-hidden>
        {Array.from({ length: beatsPerBar }, (_, i) => (
          <Box
            key={i}
            w={kids ? 52 : 40}
            h={kids ? 52 : 40}
            style={{
              borderRadius: 999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: kids ? 22 : 18,
              background:
                counting && shownBeat === i
                  ? phase === 'countin'
                    ? 'var(--mantine-color-orange-6)'
                    : 'var(--mantine-color-indigo-7)'
                  : 'var(--mantine-color-gray-2)',
              color: counting && shownBeat === i ? '#fff' : 'var(--mantine-color-dark-6)',
            }}
          >
            {i + 1}
          </Box>
        ))}
      </Group>

      <div style={{ width: 'min(100%, 560px)' }}>
        <Staff
          clef="treble"
          time={exercise.time}
          bars={[staffNotes]}
          height={kids ? 180 : 160}
          label={t('lesson.rhythm.staffLabel', { n: index + 1, total: exercise.patterns.length })}
        />
      </div>

      {phase === 'result' && score && (
        <Stack gap={4} align="center" aria-live="polite" data-testid="rhythm-result">
          <Text fw={700}>
            {t('lesson.rhythm.hits', {
              hits: score.perNote.length - score.missed,
              total: score.perNote.length,
            })}
          </Text>
          {!perfect && (
            <Text size="sm" c="dimmed">
              {score.perNote
                .map((v, i) => (v === 'ok' ? null : `${i + 1}: ${verdictText(v)}`))
                .filter(Boolean)
                .join(' · ')}
              {score.extra > 0 && ` · ${t('lesson.rhythm.extra', { count: score.extra })}`}
            </Text>
          )}
        </Stack>
      )}

      <Group>
        {(phase === 'ready' || (phase === 'result' && !perfect)) && (
          <>
            <Button variant="light" leftSection={<IconPlayerPlay />} onClick={listen}>
              {t('lesson.listen')}
            </Button>
            <Button
              size="lg"
              leftSection={phase === 'result' ? <IconRefresh /> : undefined}
              onClick={start}
            >
              {phase === 'result' ? t('lesson.again') : t('lesson.rhythm.start')}
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
        {t('lesson.part', { n: index + 1, total: exercise.patterns.length })}
      </Text>

      <div style={{ width: '100%' }}>
        <VirtualKeyboard
          from={lesson.keyboard.from}
          to={lesson.keyboard.to}
          labels={lesson.keyLabels}
          height={kids ? 160 : 140}
          interactive={inputMode === 'screen'}
        />
      </div>
    </Stack>
  );
}
