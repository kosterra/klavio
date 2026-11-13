import { memo, useEffect, useRef, useState, type ReactNode } from 'react';
import { Button, Group, Stack, Text } from '@mantine/core';
import { IconCloudRain, IconHeart, IconHeartBroken, IconRefresh } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { midiToPitchName } from '@klavio/shared';
import { useNoteLang } from './useLocalized';
import { useNoteEvents } from '../input/noteBus';
import { BuddySays } from '../components/BuddySays';
import { VirtualKeyboard } from '../components/VirtualKeyboard';
import { Staff } from '../notation/Staff';
import classes from './NoteRain.module.css';

/** treble or bass – or both: each note on the staff it belongs to (from middle C up: treble) */
export type RainClef = 'treble' | 'bass' | 'both';

interface Drop {
  id: number;
  midi: number;
  /** left edge, share of the field's width */
  x: number;
  born: number;
  fallMs: number;
  /** «Intervallregen»: the named first note – `midi` is the one to play */
  from?: number;
  /** caught or landed: shown a moment longer, then gone */
  end?: { at: number; how: 'caught' | 'landed' };
}

export const RAIN_LIVES = 3;
const CARD_H = 104;
/** every this many catches it rains a little faster */
const FASTER_EVERY = 5;

const clefOf = (clef: RainClef, midi: number) =>
  clef === 'both' ? (midi >= 60 ? 'treble' : 'bass') : clef;

/** One falling note: a little staff on a raindrop card (drawn once, then only moved). */
const NoteCard = memo(function NoteCard({
  clef,
  midi,
  from,
}: {
  clef: 'treble' | 'bass';
  midi: number;
  from?: number;
}) {
  const { t } = useTranslation();
  const lang = useNoteLang();
  if (from === undefined)
    return (
      <Staff clef={clef} notes={[{ midi }]} height={CARD_H - 8} label={t('lesson.rain.note')} />
    );
  // an interval: the first note is given (named, in colour), the second is read from it
  const name = midiToPitchName(from, lang);
  return (
    <>
      <div className={classes.from}>{t('lesson.rain.from', { note: name })}</div>
      <Staff
        clef={clef}
        notes={[{ midi: from, state: 'done' }, { midi }]}
        height={CARD_H - 30}
        label={t('lesson.rain.interval', { note: name })}
      />
    </>
  );
});

export interface RainResult {
  caught: number;
  misses: number;
}

interface Props {
  clef: RainClef;
  notes: readonly number[];
  /** «Intervallregen»: pairs [given, to play] instead of single notes */
  pairs?: readonly (readonly [number, number])[];
  /** catch this many and the round is won; without: it rains until three notes land */
  goal?: number;
  /** seconds a note takes to fall at the start */
  fall: number;
  /** the fastest it gets, in seconds */
  fastest?: number;
  kids: boolean;
  keyboard: { from: number; to: number };
  labels?: 'all' | 'c' | 'none';
  /** the screen keys can be played (else they only light up) */
  interactive: boolean;
  /** the round is won (all caught) */
  onWon?: (r: RainResult) => void;
  /** three notes have landed */
  onOver?: (r: RainResult) => void;
  /** what is offered besides «Nochmals» when the round is over */
  overActions?: (r: RainResult) => ReactNode;
  /** the line over the field when the round is over */
  overText?: (r: RainResult) => string;
  /** shown next to the hearts while it rains */
  status?: (caught: number) => ReactNode;
  /** without Klavi's bubble (the page says what to do); the end of a round shows in the field */
  compact?: boolean;
}

/**
 * «Notenregen»: notes on little staves fall from the sky; the learner plays
 * each one before it lands. Every few catches the rain gets faster, three
 * notes may land.
 */
export function NoteRainGame({
  clef,
  notes,
  pairs,
  goal,
  fall,
  fastest = 2.8,
  kids,
  keyboard,
  labels,
  interactive,
  onWon,
  onOver,
  overActions,
  overText,
  status,
  compact = false,
}: Props) {
  const { t } = useTranslation();
  const field = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<'ready' | 'play' | 'over' | 'done'>('ready');
  const [drops, setDrops] = useState<Drop[]>([]);
  const [now, setNow] = useState(0);
  const [caught, setCaught] = useState(0);
  const [lives, setLives] = useState(RAIN_LIVES);
  const [wrong, setWrong] = useState<number | null>(null);
  const [result, setResult] = useState<RainResult>({ caught: 0, misses: 0 });
  const fresh = (startAt: number) => ({
    next: startAt + 400,
    id: 0,
    fallMs: fall * 1000,
    misses: 0,
    caught: 0,
    last: -1,
    lives: RAIN_LIVES,
  });
  const game = useRef(fresh(0));
  const raf = useRef(0);
  // the falling notes (the frame loop works on this, the screen shows a copy)
  const list = useRef<Drop[]>([]);
  // the callbacks of the latest render, for the frame loop
  const latest = useRef({ onOver });
  useEffect(() => {
    latest.current = { onOver };
  });
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
  useEffect(() => () => stop(), []);

  const start = () => {
    stop();
    game.current = fresh(performance.now());
    setDrops([]);
    setCaught(0);
    setLives(RAIN_LIVES);
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
          const r = { caught: g.caught, misses: g.misses };
          setResult(r);
          setPhase('over');
          latest.current.onOver?.(r);
          return;
        }
      }
      // a new note: never the same twice in a row, never in the same place
      const alive = out.filter((d) => !d.end).length;
      // nothing falling: the next one comes right away
      if ((tNow >= g.next || alive === 0) && alive < 3) {
        let midi: number;
        let from: number | undefined;
        if (pairs?.length) {
          // an interval whose note to play is not the one just asked for
          const options = pairs.filter(([, to]) => to !== g.last);
          [from, midi] = options[Math.floor(Math.random() * options.length)] ?? pairs[0]!;
        } else {
          const choices = notes.filter((m) => m !== g.last);
          midi = choices[Math.floor(Math.random() * choices.length)] ?? notes[0]!;
        }
        const lane = out.at(-1)?.x ?? -1;
        let x = Math.random() * 0.7;
        if (Math.abs(x - lane) < 0.25) x = (x + 0.35) % 0.7;
        out = [...out, { id: g.id++, midi, from, x, born: tNow, fallMs: g.fallMs }];
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
    const g = game.current;
    g.caught++;
    if (g.caught % FASTER_EVERY === 0) g.fallMs = Math.max(fastest * 1000, g.fallMs * 0.88);
    setCaught(g.caught);
    if (goal !== undefined && g.caught >= goal) {
      // all caught
      stop();
      setPhase('done');
      onWon?.({ caught: g.caught, misses: g.misses });
    }
  });

  const alive = drops.filter((d) => !d.end);
  // Kids: a note close to the ground shows its key
  const hints =
    kids && phase === 'play'
      ? alive.filter((d) => (now - d.born) / d.fallMs > 0.7).map((d) => d.midi)
      : [];
  const drop = height - CARD_H - 12;

  return (
    <Stack align="center" gap="sm" w="100%" data-testid="note-rain">
      {!compact && (
        <BuddySays
          mood={phase === 'done' ? 'cheer' : phase === 'over' ? 'think' : 'listen'}
          size={kids ? 80 : 56}
          kids={kids}
          say={t(pairs?.length ? 'lesson.rain.taskInterval' : 'lesson.rain.task')}
          classicRow
        >
          <Text fz={kids ? 24 : 20} fw={800} aria-live="polite">
            {phase === 'done'
              ? t('lesson.rain.done')
              : phase === 'over'
                ? (overText?.(result) ?? t('lesson.rain.over'))
                : t(pairs?.length ? 'lesson.rain.taskInterval' : 'lesson.rain.task')}
          </Text>
        </BuddySays>
      )}

      <Group gap="lg" aria-live="polite" data-testid="rain-status">
        <Text fw={800}>
          {status ? status(caught) : t('lesson.rain.caught', { n: caught, total: goal ?? caught })}
        </Text>
        <Group gap={2} aria-label={t('lesson.rain.lives', { count: lives })} role="img">
          {Array.from({ length: RAIN_LIVES }, (_, i) =>
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
        data-pairs={pairs?.length ? true : undefined}
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
                transform: `translateY(${p * drop}px)`,
              }}
              aria-hidden
            >
              <NoteCard clef={clefOf(clef, d.midi)} midi={d.midi} from={d.from} />
            </div>
          );
        })}
        <div className={classes.ground} aria-hidden />
        {phase !== 'play' && phase !== 'done' && (
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
            {phase === 'over' && compact && (
              <Text fz={kids ? 24 : 20} fw={800} ta="center" className={classes.overText}>
                {overText?.(result) ?? t('lesson.rain.over')}
              </Text>
            )}
            {phase === 'over' && (
              <Group justify="center">
                <Button
                  size="lg"
                  leftSection={<IconRefresh />}
                  onClick={start}
                  data-testid="rain-again"
                >
                  {t('lesson.again')}
                </Button>
                {overActions?.(result)}
              </Group>
            )}
          </div>
        )}
      </div>

      <VirtualKeyboard
        dock
        from={keyboard.from}
        to={keyboard.to}
        labels={labels}
        height={keyboardHeight}
        interactive={interactive}
        hints={hints}
        wrong={wrong !== null ? [wrong] : []}
      />
    </Stack>
  );
}
