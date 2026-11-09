import { useEffect, useRef, useState } from 'react';
import { Button, Group, Progress, Stack, Text } from '@mantine/core';
import { IconPlayerPlay, IconSparkles } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { isBlackKey, type ImproviseExercise as Spec } from '@klavio/shared';
import { useNoteEvents } from '../input/noteBus';
import { runMetronome, type MetronomeRun } from '../audio/metronome';
import { playNote } from '../audio/synth';
import { BuddySays } from '../components/BuddySays';
import { VirtualKeyboard } from '../components/VirtualKeyboard';
import type { ExerciseProps } from './exercises';
import classes from './Improvise.module.css';

const BEATS_PER_BAR = 4;
/** the groove's bass: F sharp and C sharp for the black keys, C and G for the white ones */
const BASS = { black: [42, 49], white: [48, 43] };

/**
 * "Improvisieren": free play on the black keys over a little groove. There are
 * no wrong notes – white keys just get a friendly nudge. Done after the groove
 * with enough notes played.
 */
export function ImproviseExercise({
  exercise,
  lesson,
  inputMode,
  kids,
  onCorrect,
  onDone,
}: ExerciseProps<Spec>) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<'ready' | 'play' | 'more' | 'done'>('ready');
  const [count, setCount] = useState(0);
  const [beat, setBeat] = useState(0);
  const [nudge, setNudge] = useState(false);
  const [sparks, setSparks] = useState<{ id: number; x: number }[]>([]);
  const run = useRef<MetronomeRun | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const counted = useRef(0);
  const totalBeats = exercise.bars * BEATS_PER_BAR;

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    run.current?.stop();
  };
  useEffect(() => clear, []);

  const start = () => {
    clear();
    counted.current = 0;
    setCount(0);
    setBeat(0);
    setPhase('play');
    const accents = Array.from({ length: exercise.bars }, (_, i) => i * BEATS_PER_BAR);
    const m = runMetronome(totalBeats, exercise.tempo, accents);
    run.current = m;
    const now = performance.now();
    const beatMs = 60000 / exercise.tempo;
    m.beatTimes.forEach((at, i) => {
      timers.current.push(setTimeout(() => setBeat(i + 1), at - now));
      // the microphone would hear a bass line as notes: then only the clicks
      if (inputMode !== 'microphone' && i % 2 === 0) {
        timers.current.push(
          setTimeout(() => {
            const v = playNote(BASS[exercise.keys][(i / 2) % 2]!, 0.35);
            setTimeout(() => v?.release(), beatMs * 1.8);
          }, at - now),
        );
      }
    });
    const end = m.beatTimes[totalBeats - 1]! + beatMs - now;
    timers.current.push(
      setTimeout(() => {
        if (counted.current >= exercise.minNotes) {
          setPhase('done');
          onCorrect();
          timers.current.push(setTimeout(onDone, 1600));
        } else {
          setPhase('more');
        }
      }, end),
    );
  };

  useNoteEvents((e) => {
    if (e.type !== 'note-on' || phase !== 'play') return;
    if (isBlackKey(e.midi) !== (exercise.keys === 'black')) {
      setNudge(true);
      timers.current.push(setTimeout(() => setNudge(false), 1500));
      return;
    }
    counted.current += 1;
    setCount(counted.current);
    const id = Date.now() + Math.random();
    setSparks((s) => [...s.slice(-8), { id, x: 10 + Math.random() * 80 }]);
    timers.current.push(setTimeout(() => setSparks((s) => s.filter((x) => x.id !== id)), 1200));
  });

  // the keys that fit: all black ones, or C, E and G (they always sound good over the C groove)
  const fitting: number[] = [];
  for (let m = lesson.keyboard.from; m <= lesson.keyboard.to; m++) {
    if (exercise.keys === 'black' ? isBlackKey(m) : [0, 4, 7].includes(m % 12)) fitting.push(m);
  }
  const white = exercise.keys === 'white';

  return (
    <Stack align="center" gap="md" w="100%">
      <BuddySays
        mood={phase === 'done' ? 'cheer' : phase === 'play' ? 'happy' : 'listen'}
        size={kids ? 90 : 64}
        kids={kids}
        say={t(white ? 'lesson.improvise.readyWhite' : 'lesson.improvise.ready')}
      >
        <Text fz={kids ? 26 : 22} fw={800} ta="center" aria-live="polite">
          {phase === 'ready'
            ? t(white ? 'lesson.improvise.readyWhite' : 'lesson.improvise.ready')
            : phase === 'play'
              ? nudge
                ? t(white ? 'lesson.improvise.nudgeWhite' : 'lesson.improvise.nudge')
                : t('lesson.improvise.play')
              : phase === 'more'
                ? t('lesson.improvise.more', { min: exercise.minNotes })
                : t('lesson.improvise.done')}
        </Text>
      </BuddySays>

      <div className={classes.sky} aria-hidden>
        {sparks.map((s) => (
          <IconSparkles key={s.id} className={classes.spark} style={{ left: `${s.x}%` }} />
        ))}
      </div>
      <Group gap="xs" data-testid="improvise-count">
        <IconSparkles color="var(--mantine-color-yellow-6)" aria-hidden />
        <Text fw={800} fz="xl">
          {t('lesson.improvise.count', { count })}
        </Text>
      </Group>
      <Progress
        value={(beat / totalBeats) * 100}
        w="min(100%, 420px)"
        size="lg"
        radius="xl"
        color="blue"
        aria-label={t('lesson.improvise.progress')}
      />
      {(phase === 'ready' || phase === 'more') && (
        <Button size="xl" leftSection={<IconPlayerPlay />} onClick={start}>
          {phase === 'ready' ? t('lesson.improvise.start') : t('lesson.improvise.again')}
        </Button>
      )}
      <VirtualKeyboard
        dock
        from={lesson.keyboard.from}
        to={lesson.keyboard.to}
        labels="none"
        height={kids ? 180 : 160}
        interactive={inputMode === 'screen'}
        hints={phase === 'play' || kids ? fitting : []}
      />
    </Stack>
  );
}
