import { memo, useEffect, useRef, useState } from 'react';
import { Button, Group, Stack, Text } from '@mantine/core';
import { IconCloudRain, IconHeart, IconHeartBroken, IconRefresh } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { NoteRainExercise as Spec } from '@klavio/shared';
import { useNoteEvents } from '../input/noteBus';
import { BuddySays } from '../components/BuddySays';
import { VirtualKeyboard } from '../components/VirtualKeyboard';
import { Staff } from '../notation/Staff';
import type { ExerciseProps } from './exercises';
import classes from './NoteRain.module.css';

interface Drop {
  id: number;
  midi: number;
  /** left edge, share of the field's width */
  x: number;
  born: number;
  fallMs: number;
  /** caught or landed: shown a moment longer, then gone */
  end?: { at: number; how: 'caught' | 'landed' };
}

const LIVES = 3;
const CARD_H = 104;
/** every this many catches it rains a little faster */
const FASTER_EVERY = 5;

/** One falling note: a little staff on a raindrop card (drawn once, then only moved). */
const NoteCard = memo(function NoteCard({ clef, midi }: { clef: Spec['clef']; midi: number }) {
  const { t } = useTranslation();
  return <Staff clef={clef} notes={[{ midi }]} height={CARD_H - 8} label={t('lesson.rain.note')} />;
});

/**
 * «Notenregen»: notes on little staves fall from the sky; the learner plays
 * each one before it lands. Every few catches the rain gets faster, three
 * notes may land. Only the finished round counts – a new try starts fresh.
 */
export function NoteRainExercise({
  exercise,
  lesson,
  inputMode,
  kids,
  onCorrect,
  onMistake,
  onDone,
}: ExerciseProps<Spec>) {
  const { t } = useTranslation();
  const field = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<'ready' | 'play' | 'over' | 'done'>('ready');
  const [drops, setDrops] = useState<Drop[]>([]);
  const [now, setNow] = useState(0);
  const [caught, setCaught] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [wrong, setWrong] = useState<number | null>(null);
  const game = useRef({
    next: 0,
    id: 0,
    fallMs: exercise.fall * 1000,
    misses: 0,
    last: -1,
    lives: LIVES,
  });
  const doneTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const raf = useRef(0);
  // the falling notes (the frame loop works on this, the screen shows a copy)
  const list = useRef<Drop[]>([]);
  // the field fills the room above the docked keyboard – the ground must stay in sight
  const keyboardHeight = kids ? 180 : 160;
  const [height, setHeight] = useState(kids ? 380 : 340);
  useEffect(() => {
    const fit = () => {
      const el = field.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      const room = window.innerHeight - top - keyboardHeight - 40;
      setHeight(Math.round(Math.min(440, Math.max(220, room))));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [keyboardHeight]);

  const stop = () => cancelAnimationFrame(raf.current);
  useEffect(
    () => () => {
      stop();
      clearTimeout(doneTimer.current);
    },
    [],
  );

  const start = () => {
    stop();
    game.current = {
      next: performance.now() + 400,
      id: 0,
      fallMs: exercise.fall * 1000,
      misses: 0,
      last: -1,
      lives: LIVES,
    };
    setDrops([]);
    setCaught(0);
    setLives(LIVES);
    setPhase('play');
    list.current = [];
    const loop = () => {
      const tNow = performance.now();
      const g = game.current;
      let out = list.current.filter((d) => !d.end || tNow - d.end.at < 380);
      // a note that reaches the ground is lost
      let landed = 0;
      out = out.map((d) => {
        if (d.end || tNow - d.born < d.fallMs) return d;
        landed++;
        return { ...d, end: { at: tNow, how: 'landed' as const } };
      });
      if (landed) {
        g.misses += landed;
        g.lives = Math.max(0, g.lives - landed);
        setLives(g.lives);
        if (g.lives <= 0) {
          // three notes have landed: this round is over
          list.current = out;
          setDrops(out);
          setPhase('over');
          return;
        }
      }
      // a new note: never the same twice in a row, never in the same place
      const alive = out.filter((d) => !d.end).length;
      // nothing falling: the next one comes right away
      if ((tNow >= g.next || alive === 0) && alive < 3) {
        const choices = exercise.notes.filter((m) => m !== g.last);
        const midi = choices[Math.floor(Math.random() * choices.length)] ?? exercise.notes[0]!;
        const lane = out.at(-1)?.x ?? -1;
        let x = Math.random() * 0.7;
        if (Math.abs(x - lane) < 0.25) x = (x + 0.35) % 0.7;
        out = [...out, { id: g.id++, midi, x, born: tNow, fallMs: g.fallMs }];
        g.last = midi;
        g.next = tNow + g.fallMs * 0.5;
      }
      list.current = out;
      setDrops(out);
      setNow(tNow);
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
  };

  useNoteEvents((e) => {
    if (e.type !== 'note-on' || phase !== 'play') return;
    const tNow = performance.now();
    // the lowest falling note of that pitch is caught
    const left = (d: Drop) => d.fallMs - (tNow - d.born);
    const target = list.current
      .filter((d) => !d.end && d.midi === e.midi)
      .sort((a, b) => left(a) - left(b))[0];
    if (!target) {
      game.current.misses++;
      setWrong(e.midi);
      setTimeout(() => setWrong(null), 400);
      return;
    }
    list.current = list.current.map((d) =>
      d.id === target.id ? { ...d, end: { at: tNow, how: 'caught' as const } } : d,
    );
    setDrops(list.current);
    const n = caught + 1;
    if (n % FASTER_EVERY === 0) game.current.fallMs = Math.max(2800, game.current.fallMs * 0.88);
    setCaught(n);
    if (n >= exercise.goal) {
      // all caught: only this round counts
      stop();
      setPhase('done');
      for (let i = 0; i < exercise.goal; i++) onCorrect();
      for (let i = 0; i < game.current.misses; i++) onMistake();
      doneTimer.current = setTimeout(onDone, 1400);
    }
  });

  const giveUp = () => {
    // what was caught counts, the rest as missed
    for (let i = 0; i < caught; i++) onCorrect();
    for (let i = 0; i < exercise.goal - caught; i++) onMistake();
    onDone();
  };

  const alive = drops.filter((d) => !d.end);
  // Kids: a note close to the ground shows its key
  const hints =
    kids && phase === 'play'
      ? alive.filter((d) => (now - d.born) / d.fallMs > 0.7).map((d) => d.midi)
      : [];
  const fall = height - CARD_H - 12;

  return (
    <Stack align="center" gap="sm" w="100%" data-testid="note-rain">
      <BuddySays
        mood={phase === 'done' ? 'cheer' : phase === 'over' ? 'think' : 'listen'}
        size={kids ? 80 : 56}
        kids={kids}
        say={t('lesson.rain.task')}
        classicRow
      >
        <Text fz={kids ? 24 : 20} fw={800} aria-live="polite">
          {phase === 'done'
            ? t('lesson.rain.done')
            : phase === 'over'
              ? t('lesson.rain.over')
              : t('lesson.rain.task')}
        </Text>
      </BuddySays>

      <Group gap="lg" aria-live="polite" data-testid="rain-status">
        <Text fw={800}>{t('lesson.rain.caught', { n: caught, total: exercise.goal })}</Text>
        <Group gap={2} aria-label={t('lesson.rain.lives', { count: lives })} role="img">
          {Array.from({ length: LIVES }, (_, i) =>
            i < lives ? (
              <IconHeart key={i} size={22} className={classes.heart} aria-hidden />
            ) : (
              <IconHeartBroken key={i} size={22} className={classes.heartLost} aria-hidden />
            ),
          )}
        </Group>
      </Group>

      <div
        ref={field}
        className={classes.field}
        data-kids={kids || undefined}
        style={{ height }}
        // for automated tests: the falling notes, lowest first
        data-drops={JSON.stringify(
          alive
            .slice()
            .sort((a, b) => a.born - b.born)
            .map((d) => d.midi),
        )}
      >
        {drops.map((d) => {
          const p = Math.min(1, (now - d.born) / d.fallMs);
          return (
            <div
              key={d.id}
              className={classes.drop}
              data-end={d.end?.how}
              style={{
                left: `calc((100% - var(--card)) * ${d.x / 0.7})`,
                transform: `translateY(${p * fall}px)`,
              }}
              aria-hidden
            >
              <NoteCard clef={exercise.clef} midi={d.midi} />
            </div>
          );
        })}
        <div className={classes.ground} aria-hidden />
        {phase !== 'play' && (
          <div className={classes.overlay}>
            {phase === 'ready' && (
              <Button
                size="lg"
                leftSection={<IconCloudRain />}
                onClick={start}
                data-testid="rain-start"
              >
                {t('lesson.rain.start')}
              </Button>
            )}
            {phase === 'over' && (
              <Group>
                <Button size="lg" leftSection={<IconRefresh />} onClick={start}>
                  {t('lesson.again')}
                </Button>
                <Button size="lg" variant="default" onClick={giveUp}>
                  {t('common.continue')}
                </Button>
              </Group>
            )}
          </div>
        )}
      </div>

      <VirtualKeyboard
        dock
        from={lesson.keyboard.from}
        to={lesson.keyboard.to}
        labels={lesson.keyLabels}
        height={keyboardHeight}
        interactive={inputMode === 'screen'}
        hints={hints}
        wrong={wrong !== null ? [wrong] : []}
      />
    </Stack>
  );
}
