import { useEffect, useRef, useState } from 'react';
import { Button, Card, Group, Stack, Text } from '@mantine/core';
import { IconCheck, IconHandStop, IconPlayerPlay, IconVolume, IconX } from '@tabler/icons-react';
import { useMediaQuery } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import {
  beatsOf,
  rhythmOnsets,
  type ClapStep,
  type ListenStep,
  type QuizStep,
  type TapKeysStep,
  type TheoryStep,
} from '@klavio/shared';
import { Buddy } from '../../components/Buddy';
import { ReadAloudButton } from '../../components/ReadAloud';
import { useAutoRead } from '../../components/useReadAloud';
import { PianoKeyboard } from '../../components/PianoKeyboard';
import { playMelody, playNote, type Playback } from '../../audio/synth';
import { runMetronome, type MetronomeRun } from '../../audio/metronome';
import { useLocalized } from '../useLocalized';
import { scoreRhythm } from '../rhythmScore';
import { NoteRow } from './NoteValues';
import { TheoryPicture } from './TheoryPicture';
import classes from './Theory.module.css';

type Feedback = { ok: boolean; text: string } | null;

interface StepProps<S> {
  step: S;
  kids: boolean;
  onSolved: () => void;
  setFeedback: (f: Feedback) => void;
}

/** Short tap sound for the screen keyboard (released by itself). */
function tap(midi: number) {
  const v = playNote(midi, 0.7);
  setTimeout(() => v?.release(), 450);
}

// ------------------------------------------------------------------ tap keys
function TapKeys({ step, kids, onSolved, setFeedback }: StepProps<TapKeysStep>) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const [found, setFound] = useState<number[]>([]);
  const [wrong, setWrong] = useState<number | null>(null);
  const need = step.need === 'one' ? 1 : step.targets.length;
  const done = found.length >= need;

  const press = (m: number) => {
    tap(m);
    if (done) return;
    const g = step.targets.findIndex((group) => group.includes(m));
    if (g < 0) {
      setWrong(m);
      setTimeout(() => setWrong(null), 600);
      setFeedback({ ok: false, text: loc(step.hint) });
      return;
    }
    if (found.includes(g)) return;
    const next = [...found, g];
    setFound(next);
    if (next.length >= need) {
      setFeedback({ ok: true, text: t('theory.right') });
      onSolved();
    } else {
      setFeedback({ ok: true, text: t('theory.found', { n: next.length, total: need }) });
    }
  };

  return (
    <PianoKeyboard
      from={step.keyboard.from}
      to={step.keyboard.to}
      labels={step.labels}
      height={kids ? 170 : 140}
      correct={found.flatMap((g) => step.targets[g]!)}
      wrong={wrong === null ? [] : [wrong]}
      onPress={press}
    />
  );
}

// ---------------------------------------------------------------------- quiz
function Quiz({ step, kids, onSolved, setFeedback }: StepProps<QuizStep>) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const [tried, setTried] = useState<number[]>([]);
  const [solved, setSolved] = useState(false);
  return (
    <Stack gap="md">
      {step.picture && <TheoryPicture picture={step.picture} kids={kids} />}
      <div className={classes.answers} role="group" aria-label={loc(step.text)}>
        {step.answers.map((a, i) => {
          const wrong = tried.includes(i) && !a.correct;
          const right = solved && a.correct;
          return (
            <Button
              key={i}
              size={kids ? 'xl' : 'lg'}
              variant={right ? 'filled' : 'default'}
              color={right ? 'teal' : wrong ? 'red' : undefined}
              className={classes.answer}
              data-wrong={wrong || undefined}
              leftSection={right ? <IconCheck /> : wrong ? <IconX /> : undefined}
              disabled={solved && !a.correct}
              aria-pressed={tried.includes(i)}
              onClick={() => {
                if (solved) return;
                setTried((x) => [...x, i]);
                if (a.correct) {
                  setSolved(true);
                  setFeedback({ ok: true, text: t('theory.right') });
                  onSolved();
                } else {
                  setFeedback({
                    ok: false,
                    text: step.hint ? loc(step.hint) : t('theory.tryAgain'),
                  });
                }
              }}
            >
              {loc(a.text)}
            </Button>
          );
        })}
      </div>
    </Stack>
  );
}

// -------------------------------------------------------------------- listen
function Listen({ step, kids, onSolved, setFeedback }: StepProps<ListenStep>) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const [round, setRound] = useState(0);
  const [done, setDone] = useState(false);
  const [playing, setPlaying] = useState<number | null>(null);
  const playback = useRef<Playback | null>(null);
  const r = step.rounds[round]!;
  // two-note questions slowly, melodies a bit quicker
  const tempo = r.notes.length > 2 ? 150 : 80;

  const play = () => {
    playback.current?.stop();
    const p = playMelody(
      r.notes.map((m) => ({ midi: m, beats: 1 })),
      tempo,
      (i) => setPlaying(i),
    );
    playback.current = p;
    void p.done.then(() => setPlaying(null));
  };

  // play each new round by itself (the click on "next" was the user gesture)
  useEffect(() => {
    const id = setTimeout(play, 350);
    return () => {
      clearTimeout(id);
      playback.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const answer = (i: 0 | 1) => {
    if (done) return;
    if (i !== r.answer) {
      setFeedback({ ok: false, text: t('theory.listenAgain') });
      play();
      return;
    }
    if (round + 1 < step.rounds.length) {
      setFeedback({ ok: true, text: t('theory.right') });
      setTimeout(() => setRound(round + 1), 700);
    } else {
      setDone(true);
      setFeedback({ ok: true, text: t('theory.allRight') });
      onSolved();
    }
  };

  return (
    <Stack align="center" gap="md">
      <Text size="sm" fw={700} c="dimmed">
        {t('theory.round', { n: round + 1, total: step.rounds.length })}
      </Text>
      <Button
        size={kids ? 'xl' : 'lg'}
        variant="light"
        leftSection={<IconVolume />}
        onClick={play}
        data-playing={playing !== null || undefined}
      >
        {t('theory.listen')}
      </Button>
      <div className={classes.answers}>
        {step.answers.map((a, i) => (
          <Button
            key={i}
            size={kids ? 'xl' : 'lg'}
            variant="default"
            className={classes.answer}
            disabled={done}
            onClick={() => answer(i as 0 | 1)}
          >
            {loc(a)}
          </Button>
        ))}
      </div>
    </Stack>
  );
}

// ---------------------------------------------------------------------- clap
function Clap({ step, kids, onSolved, setFeedback }: StepProps<ClapStep>) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<'ready' | 'countin' | 'play' | 'done'>('ready');
  const [beat, setBeat] = useState<number | null>(null);
  const taps = useRef<number[]>([]);
  const run = useRef<MetronomeRun | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const bar = Math.round(step.pattern.reduce((n, v) => n + beatsOf(v), 0));
  const beatMs = 60000 / step.tempo;

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    run.current?.stop();
  };
  useEffect(() => clear, []);

  const start = () => {
    clear();
    taps.current = [];
    setFeedback(null);
    const m = runMetronome(bar * 2, step.tempo, [0, bar]);
    run.current = m;
    const playStart = m.beatTimes[bar]!;
    const expected = rhythmOnsets(step.pattern).map((o) => playStart + o * beatMs);
    setPhase('countin');
    const now = performance.now();
    m.beatTimes.forEach((bt, i) => timers.current.push(setTimeout(() => setBeat(i), bt - now)));
    timers.current.push(
      setTimeout(() => setPhase('play'), playStart - now - beatMs / 2),
      setTimeout(
        () => {
          setBeat(null);
          const s = scoreRhythm(expected, taps.current, 220);
          if (s.missed === 0 && s.extra === 0) {
            setPhase('done');
            setFeedback({ ok: true, text: t('theory.clapGood') });
            onSolved();
          } else {
            setPhase('ready');
            setFeedback({ ok: false, text: t('theory.clapAgain') });
          }
        },
        playStart + bar * beatMs - now + 200,
      ),
    );
  };

  const clap = () => {
    if (phase === 'play' || phase === 'countin') taps.current.push(performance.now());
  };

  return (
    <Stack align="center" gap="md">
      <NoteRow pattern={step.pattern} />
      <Group gap="xs" aria-hidden>
        {Array.from({ length: bar * 2 }, (_, i) => (
          <span
            key={i}
            className={classes.beatDot}
            data-active={beat === i || undefined}
            data-countin={i < bar || undefined}
          />
        ))}
      </Group>
      <Text size="sm" fw={700} c="dimmed" aria-live="polite">
        {phase === 'countin' && beat !== null && beat < bar
          ? t('theory.countIn', { n: beat + 1 })
          : phase === 'play'
            ? t('theory.clapNow')
            : ' '}
      </Text>
      {phase === 'ready' || phase === 'done' ? (
        <Button
          size={kids ? 'xl' : 'lg'}
          leftSection={<IconPlayerPlay />}
          onClick={start}
          variant={phase === 'done' ? 'default' : 'filled'}
        >
          {phase === 'done' ? t('theory.clapAgainButton') : t('theory.clapStart')}
        </Button>
      ) : (
        <Button
          size="xl"
          // dark text on light orange: enough contrast for the big label
          color="orange.4"
          c="dark.9"
          fw={800}
          className={classes.clapButton}
          leftSection={<IconHandStop />}
          onPointerDown={(e) => {
            e.preventDefault();
            clap();
          }}
          onKeyDown={(e) => {
            if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
              e.preventDefault();
              clap();
            }
          }}
          data-autofocus
        >
          {t('theory.clap')}
        </Button>
      )}
    </Stack>
  );
}

// -------------------------------------------------------------------- runner

/**
 * "Entdecken": the short theory part before a lesson. One step at a time, the
 * learner's figure explains; games and quizzes must be solved to go on (wrong
 * answers only give a hint). Nothing here is scored.
 */
export function TheorySteps({
  steps,
  kids,
  onDone,
  title,
  doneLabel,
  skipLabel,
}: {
  steps: TheoryStep[];
  kids: boolean;
  onDone: () => void;
  /** heading above the steps (default "Entdecken") */
  title?: string;
  /** label of the last button (default "Jetzt spielen!") */
  doneLabel?: string;
  /** label of the skip button (default "Überspringen") */
  skipLabel?: string;
}) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const narrow = useMediaQuery('(max-width: 36em)') ?? false;
  const [autoRead] = useAutoRead();
  const [index, setIndex] = useState(0);
  const [solved, setSolved] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const step = steps[index]!;
  const last = index === steps.length - 1;
  const canGoOn = step.type === 'explain' || solved;

  const next = () => {
    if (last) {
      onDone();
      return;
    }
    setIndex(index + 1);
    setSolved(false);
    setFeedback(null);
  };

  const props = { kids, onSolved: () => setSolved(true), setFeedback };
  const mood = solved
    ? 'cheer'
    : step.type === 'listen' || step.type === 'clap'
      ? 'listen'
      : step.type === 'explain'
        ? 'happy'
        : 'think';

  return (
    <Card
      withBorder
      radius="xl"
      padding={narrow ? 'md' : kids ? 'xl' : 'lg'}
      maw={760}
      mx="auto"
      w="100%"
    >
      <Stack gap="lg">
        <Group justify="space-between" wrap="nowrap">
          <Text size="sm" fw={800} tt="uppercase" c="dimmed">
            {title ?? t('theory.title')}
          </Text>
          <Group
            gap={6}
            role="img"
            aria-label={t('theory.stepOf', { n: index + 1, total: steps.length })}
          >
            {steps.map((_, i) => (
              <span
                key={i}
                className={classes.dot}
                data-state={i < index ? 'done' : i === index ? 'current' : undefined}
              />
            ))}
          </Group>
        </Group>

        <Group wrap="nowrap" align="flex-start" gap="md">
          <div className={classes.buddy}>
            <Buddy mood={mood} size={narrow ? 52 : kids ? 96 : 72} />
          </div>
          <div className={classes.bubble}>
            <Text
              fz={kids && !narrow ? 'xl' : 'lg'}
              fw={kids ? 600 : 500}
              key={index}
              data-testid="theory-text"
            >
              {loc(step.text)}
            </Text>
          </div>
          <ReadAloudButton key={index} text={loc(step.text)} auto={autoRead} />
        </Group>

        <div key={index}>
          {step.type === 'explain' ? (
            step.picture && <TheoryPicture picture={step.picture} kids={kids} />
          ) : step.type === 'tap-keys' ? (
            <TapKeys step={step} {...props} />
          ) : step.type === 'quiz' ? (
            <Quiz step={step} {...props} />
          ) : step.type === 'listen' ? (
            <Listen step={step} {...props} />
          ) : (
            <Clap step={step} {...props} />
          )}
        </div>

        <Text
          role="status"
          ta="center"
          fw={700}
          mih={26}
          c={
            feedback ? (feedback.ok ? 'var(--klavio-success)' : 'var(--klavio-danger)') : undefined
          }
        >
          {feedback?.text ?? ''}
        </Text>

        <Group justify="space-between">
          <Button variant="subtle" color="gray" onClick={onDone}>
            {skipLabel ?? t('theory.skip')}
          </Button>
          <Button
            size={kids ? 'xl' : 'lg'}
            disabled={!canGoOn}
            onClick={next}
            data-testid="theory-next"
          >
            {last ? (doneLabel ?? t('theory.toLesson')) : t('theory.next')}
          </Button>
        </Group>
      </Stack>
    </Card>
  );
}
