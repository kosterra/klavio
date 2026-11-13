import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CloseButton,
  Group,
  Progress,
  Stack,
  Text,
  Title,
  VisuallyHidden,
} from '@mantine/core';
import { IconDeviceDesktop, IconMicrophone, IconPiano } from '@tabler/icons-react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router';
import { useMediaQuery } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../components/usePageTitle';
import {
  LESSONS,
  midiToPitchName,
  applyCompletion,
  chapterOf,
  findLesson,
  isLessonUnlocked,
  lessonTargetCount,
  levelForXp,
  localIsoDate,
  nextStreak,
  starsFor,
  scoringTarget,
  newlyReachedGoalSkills,
  recapFor,
  theoryFor,
  xpFor,
  type Lesson,
  type LessonResultDto,
  type ProfileDto,
  type ProgressDto,
  LESSON_COACH,
  lessonHandShape,
} from '@klavio/shared';
import { enqueueResult } from '../offline/queue';
import { flushQueue } from '../offline/sync';
import { notify } from '../components/notify';
import { useSession } from '../auth/session';
import { useErrorText } from '../auth/useErrorText';
import { useMicErrorText } from '../audio/micErrorText';
import { Buddy } from '../components/Buddy';
import { PrivacyBadge } from '../components/PrivacyNote';
import { FindKeyExercise } from '../lesson/FindKeyExercise';
import { PlayAlongExercise } from '../lesson/PlayAlongExercise';
import { ReadNoteExercise } from '../lesson/ReadNoteExercise';
import { SongExercise } from '../lesson/SongExercise';
import { TimedSongExercise } from '../lesson/TimedSongExercise';
import { ChordsExercise } from '../lesson/ChordsExercise';
import { ListenExercise } from '../lesson/ListenExercise';
import { SightReadExercise } from '../lesson/SightReadExercise';
import { EchoExercise } from '../lesson/EchoExercise';
import { DynamicsExercise } from '../lesson/DynamicsExercise';
import { PedalExercise } from '../lesson/PedalExercise';
import { RhythmExercise } from '../lesson/RhythmExercise';
import { PieceExercise } from '../lesson/PieceExercise';
import { ImproviseExercise } from '../lesson/ImproviseExercise';
import { LessonSummary } from '../lesson/LessonSummary';
import { useLessonInput, type LessonInputMode } from '../lesson/useLessonInput';
import { usePlayOn } from '../lesson/playOn';
import { LessonParts } from '../lesson/LessonParts';
import { ProgressPending } from '../components/ProgressPending';
import { ConfirmModal } from '../components/ConfirmModal';
import { CoachTip } from '../lesson/CoachTip';
import { HandOnKeys } from '../lesson/HandOnKeys';
import { useNoteEvents } from '../input/noteBus';
import { useLocalized } from '../lesson/useLocalized';
import { loadProgress, useProgress } from '../lesson/useProgress';
import { TheorySteps } from '../lesson/theory/TheorySteps';
import { NoteRainExercise } from '../lesson/NoteRainExercise';
import { GoalMilestone } from '../goal/GoalMilestone';
import { WorldDone } from '../lesson/WorldDone';
import { Scenery } from '../lesson/WorldScenery';
import { finishesWorld, worldOfLesson } from '../lesson/worlds';
import { useWorldMode } from '../lesson/useWorldMode';
import { useLessonFor } from '../lesson/useLessonFor';
import stage from '../lesson/LessonStage.module.css';

/** «Auf meinem Klavier» or «Auf dem Bildschirm», remembered on this device. */

type ShownResult = LessonResultDto & { pending?: boolean; loginNeeded?: boolean };

/**
 * What the server would answer, computed on the device with the same rules —
 * for results played offline (synced later; badges are awarded then).
 */
function localResult(
  lesson: Lesson,
  body: { mistakes: number; durationSec: number; localDate: string },
  profile: ProfileDto,
  before: ProgressDto,
): ShownResult {
  const stars = starsFor(scoringTarget(lesson.id), body.mistakes);
  const previousBest = before.lessons[lesson.id]?.bestStars ?? 0;
  const { wasDue, bonusXp } = applyCompletion(before.lessons[lesson.id], stars, body.localDate);
  const replayedToday = before.lessons[lesson.id]?.lastDate === body.localDate;
  const xpGained = xpFor(lesson.xp, stars, previousBest, replayedToday) + bonusXp;
  const xp = profile.xp + xpGained;
  const level = levelForXp(xp);
  return {
    stars,
    bestStars: Math.max(stars, previousBest),
    firstCompletion: previousBest === 0,
    xpGained,
    xp,
    level,
    leveledUp: level > profile.level,
    streak: nextStreak(profile.streak, body.localDate),
    today: {
      date: body.localDate,
      seconds: before.today.seconds + body.durationSec,
      xp: before.today.xp + xpGained,
    },
    review: wasDue,
    newBadges: [],
    pending: true,
  };
}

/** Full-screen lesson: intro → exercises → summary. */
/** how much of the progress bar the theory part fills, when there is one */
const THEORY_SHARE = 25;

export function LessonPage() {
  const { lessonId = '' } = useParams();
  // Remount per lesson so "next lesson" loads fresh progress for the unlock check.
  return <LessonGate key={lessonId} lessonId={lessonId} />;
}

function LessonGate({ lessonId }: { lessonId: string }) {
  const lesson = findLesson(lessonId);
  const { completed, progress, error, reload } = useProgress();
  const [attempt, setAttempt] = useState(0);
  const forMe = useLessonFor();

  if (!lesson) return <Navigate to="/" replace />;
  // short wait for the unlock check
  if (!progress) return <ProgressPending fullPage error={error} onRetry={() => void reload()} />;
  if (!isLessonUnlocked(lesson.id, completed)) return <Navigate to="/" replace />;
  return (
    <LessonRun
      key={`${lesson.id}-${attempt}`}
      lesson={forMe(lesson)}
      // the theory part comes first only until the lesson has been played once
      discoverFirst={attempt === 0 && !completed.has(lesson.id)}
      completedBefore={completed}
      onAgain={() => setAttempt((a) => a + 1)}
    />
  );
}

function LessonRun({
  lesson,
  discoverFirst,
  completedBefore,
  onAgain,
}: {
  lesson: Lesson;
  discoverFirst: boolean;
  /** lessons completed before this run (for the goal-song milestone) */
  completedBefore: Set<string>;
  onAgain: () => void;
}) {
  const { t, i18n } = useTranslation();
  const loc = useLocalized();
  usePageTitle(loc(lesson.title));
  const navigate = useNavigate();
  const errorText = useErrorText();
  const micErrorText = useMicErrorText();
  const { me, activeProfile, refresh, applyLocalResult } = useSession();
  const input = useLessonInput();
  const kids = activeProfile?.uiMode !== 'classic';
  const worldSet = useWorldMode();
  const theory = theoryFor(lesson.id, worldSet);
  // first visit: "Weisst du's noch?" (start of a chapter) + the lesson's theory
  const [steps, setSteps] = useState(() =>
    discoverFirst ? [...recapFor(lesson.id), ...theory] : theory,
  );
  const [phase, setPhase] = useState<'theory' | 'intro' | 'play' | 'result'>(
    discoverFirst && steps.length ? 'theory' : 'intro',
  );
  // the bar counts «Entdecken» too: its steps fill the first quarter
  const [theoryAt, setTheoryAt] = useState(0);
  const theoryShare = discoverFirst && steps.length ? THEORY_SHARE : 0;
  // how the learner played last time on this device: shown first
  // what the learner chose (start-up questions, «Mein Profil», last time) – fixed for this visit
  const [savedPlayOn, setPlayOn] = usePlayOn();
  const [playOn] = useState(savedPlayOn);
  const startLesson = (choice: 'piano' | 'screen' = 'piano') => {
    // the real piano: the microphone starts with this tap (iOS needs a gesture)
    if (choice === 'piano') input.startPreferred();
    // the other way chosen: from now on the first one offered
    void setPlayOn(choice).catch(() => undefined);
    startedAt.current = performance.now();
    setPhase('play');
  };
  // a digital piano: the first key played on the start card starts the lesson
  useNoteEvents((e) => {
    if (phase === 'intro' && e.type === 'note-on' && e.source === 'midi') startLesson('piano');
  });

  // every step of a lesson starts at the top (the button to it may sit far down on a phone)
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [phase]);
  // a phone held sideways has little height: smaller figures
  const short = useMediaQuery('(max-height: 32em)') ?? false;
  const [micDetails, setMicDetails] = useState(false);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const mistakes = useRef(0);
  // which notes went wrong (by name): named in the summary, so one knows what to practise
  const missedNotes = useRef(new Map<string, number>());
  const [hardNotes, setHardNotes] = useState<{ note: string; count: number }[]>([]);
  const startedAt = useRef(0);
  const [result, setResult] = useState<ShownResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // the X during the lesson asks first – a tap by mistake must not lose the run
  const [quitAsk, setQuitAsk] = useState(false);
  const [missed, setMissed] = useState(false);
  const started = phase === 'play' && (correct > 0 || missed || exerciseIndex > 0);
  const total = lessonTargetCount(lesson);
  const chapter = chapterOf(lesson.id);
  const handShape = lessonHandShape(lesson);
  const where = worldOfLesson(lesson.id, worldSet);
  const next = LESSONS[LESSONS.findIndex((l) => l.id === lesson.id) + 1] ?? null;
  const { stopMicrophone } = input;

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    const body = {
      mistakes: mistakes.current,
      durationSec: Math.min(
        3600,
        Math.max(1, Math.round((performance.now() - startedAt.current) / 1000)),
      ),
      localDate: localIsoDate(),
    };
    if (!me || !activeProfile) {
      setSaving(false);
      return;
    }
    // Into the queue first: sent after any results still waiting from before
    // (a lesson only counts after the ones played earlier), and kept on the
    // device if it cannot be sent now.
    const entry = enqueueResult({
      ...body,
      userId: me.user.id,
      profileId: activeProfile.id,
      lessonId: lesson.id,
    });
    try {
      const out = await flushQueue(me.user.id);
      const saved = out.saved[entry.id];
      if (saved) {
        if (out.synced > 1) notify(t('offline.synced', { count: out.synced - 1 }));
        setResult(saved);
        await refresh(); // XP, level and streak on the dashboard
        return;
      }
      const refused = out.refused[entry.id];
      if (refused) {
        setSaveError(errorText(refused));
        return;
      }
      // Still waiting (offline, server away, logged out): shown right away.
      const before = await loadProgress(activeProfile.id, entry.id).catch(() => null);
      if (!before) {
        setSaveError(t('common.error'));
        return;
      }
      const local = localResult(lesson, body, activeProfile, before);
      applyLocalResult(activeProfile.id, {
        xp: local.xp,
        level: local.level,
        streak: local.streak,
      });
      const loginNeeded = out.stoppedBy?.status === 401;
      setResult({ ...local, loginNeeded });
      // offline or the server away: the app notices when it is back and sends it
      // (logged out: the result waits for the login – the summary stays visible)
      if (!loginNeeded) void refresh();
    } finally {
      setSaving(false);
    }
  };

  const finishExercise = () => {
    if (exerciseIndex + 1 < lesson.exercises.length) {
      setExerciseIndex(exerciseIndex + 1);
      return;
    }
    stopMicrophone();
    setHardNotes(
      [...missedNotes.current.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([note, count]) => ({ note, count })),
    );
    setPhase('result');
    void save();
  };

  // Free the microphone when leaving the lesson.
  useEffect(() => () => stopMicrophone(), [stopMicrophone]);

  const exercise = lesson.exercises[exerciseIndex]!;
  const exerciseProps = {
    lesson,
    inputMode: input.mode,
    kids,
    onCorrect: () => {
      setCorrect((c) => c + 1);
      // a short tap on the screen keys (never with the microphone: it would hear the buzz)
      if (input.mode === 'screen') navigator.vibrate?.(15);
    },
    onMistake: (expected?: number) => {
      mistakes.current++;
      setMissed(true);
      if (expected !== undefined) {
        const name = midiToPitchName(expected, i18n.language.startsWith('de') ? 'de' : 'en');
        missedNotes.current.set(name, (missedNotes.current.get(name) ?? 0) + 1);
      }
      if (input.mode === 'screen') navigator.vibrate?.([30, 40, 30]);
    },
    onDone: finishExercise,
  };

  return (
    <div
      className={`${kids ? stage.stage : stage.calm} ${stage.lit}`}
      style={where.vars}
      data-world={where.world.id}
      // stage lighting: story moments in Klavio's colours, playing in a calm light
      data-light={phase === 'play' ? 'play' : 'story'}
    >
      {kids && (
        <div className={stage.scenery} aria-hidden>
          <Scenery world={where.world.id} chapterId="lesson" height={40} />
        </div>
      )}
      <Box mih="100dvh" p="md" maw={1100} mx="auto" pos="relative">
        <Stack gap="md" className={phase === 'play' ? undefined : stage.storyStack}>
          {/* ------------------------------------------------------ top bar */}
          <Group justify="space-between" wrap="nowrap" gap="sm" className={stage.hud}>
            <CloseButton
              size="xl"
              radius="xl"
              aria-label={t('lesson.close')}
              onClick={() => (started ? setQuitAsk(true) : navigate('/'))}
            />
            <Progress
              value={
                phase === 'result'
                  ? 100
                  : phase === 'theory'
                    ? (theoryAt / steps.length) * THEORY_SHARE
                    : theoryShare + (correct / total) * (100 - theoryShare)
              }
              size="xl"
              radius="xl"
              style={{ flex: 1 }}
              aria-label={t('lesson.progress')}
              color={kids ? where.color : 'teal'}
              striped={kids}
              animated={kids && phase === 'play'}
              bg={kids ? 'var(--klavio-surface)' : undefined}
            />
            {phase === 'play' ? <InputSwitch input={input} /> : <PrivacyBadge />}
          </Group>

          {/* every note heard gets an answer, whatever the exercise */}
          {phase === 'play' && <HeardNote mode={input.mode} />}

          {/* one line – the task matters more; the details on request */}
          {input.micError && phase === 'play' && (
            <Alert color="orange" p="xs" data-testid="mic-off">
              <Group gap="xs" wrap="nowrap" justify="space-between">
                <Text size="sm" fw={700}>
                  {t('lesson.micOff')}
                </Text>
                <Button
                  variant="transparent"
                  size="compact-sm"
                  c="inherit"
                  td="underline"
                  style={{ flex: 'none' }}
                  onClick={() => setMicDetails((d) => !d)}
                  aria-expanded={micDetails}
                >
                  {t('lesson.why')}
                </Button>
              </Group>
              {micDetails && (
                <Text size="sm" mt={4}>
                  {micErrorText(input.micError)} {t('lesson.useScreen')}
                </Text>
              )}
            </Alert>
          )}

          {/* ------------------------------------------- theory ("Entdecken") */}
          {phase === 'theory' && (
            <TheorySteps
              steps={steps}
              kids={kids}
              onDone={() => setPhase('intro')}
              onStep={setTheoryAt}
              lessonTitle={loc(lesson.title)}
            />
          )}

          {/* -------------------------------------------------------- intro */}
          {phase === 'intro' && (
            <Card withBorder radius="xl" padding="xl" maw={640} mx="auto" w="100%">
              <Stack align="center" gap="md">
                <Buddy mood="happy" size={short ? 56 : kids ? 120 : 80} />
                {chapter && (
                  <Text size="sm" fw={700} c="indigo.8" tt="uppercase">
                    {loc(chapter.title)}
                  </Text>
                )}
                <Title order={1} ta="center">
                  {loc(lesson.title)}
                </Title>
                <Text fz="lg" ta="center">
                  {loc(lesson.intro)}
                </Text>
                {handShape && (
                  <Stack gap={4} w="100%" align="center">
                    <Text fw={800}>{t('hand.title')}</Text>
                    <HandOnKeys shape={handShape} />
                  </Stack>
                )}
                {theory.length > 0 && (
                  <Button
                    variant="subtle"
                    onClick={() => {
                      setSteps(theory);
                      setTheoryAt(0);
                      setPhase('theory');
                    }}
                    data-testid="theory-again"
                  >
                    {t('theory.again')}
                  </Button>
                )}
                {/* how to play: a clear choice, the real piano first */}
                {input.mode === 'midi' || !input.micSupported ? (
                  <>
                    <InputInfo
                      mode={input.mode}
                      midiDevice={input.midiDevice}
                      micSupported={input.micSupported}
                    />
                    <Button
                      size="xl"
                      mt="sm"
                      onClick={() => startLesson('piano')}
                      data-testid="lesson-start"
                    >
                      {t('lesson.start')}
                    </Button>
                  </>
                ) : (
                  <Stack gap="xs" w="100%" maw={420} mt="sm" align="center">
                    {/* the way chosen in the start-up questions or last time; the other one a tap away */}
                    <Button
                      size="xl"
                      fullWidth
                      h="auto"
                      mih={60}
                      py="xs"
                      // «Los geht's!» big, where to play small below – fits narrow cards
                      styles={{ label: { whiteSpace: 'normal', lineHeight: 1.2 } }}
                      leftSection={playOn === 'piano' ? <IconMicrophone /> : <IconDeviceDesktop />}
                      onClick={() => startLesson(playOn)}
                      data-testid={playOn === 'piano' ? 'lesson-start' : 'lesson-start-screen'}
                    >
                      <span>
                        {t('lesson.start')}
                        <Text component="span" display="block" fz="sm" fw={500}>
                          {t(playOn === 'piano' ? 'lesson.startPiano' : 'lesson.startScreen')}
                        </Text>
                      </span>
                    </Button>
                    {playOn === 'piano' && (
                      <Text size="sm" c="dimmed" ta="center">
                        {t('lesson.playPianoHint')}{' '}
                        {activeProfile?.calibration.noiseFloorDb == null && (
                          <Link to="/mic-setup" state={{ from: `/lesson/${lesson.id}` }}>
                            {t('mic.setup')}
                          </Link>
                        )}
                      </Text>
                    )}
                    <Button
                      variant="subtle"
                      size="compact-md"
                      onClick={() => startLesson(playOn === 'screen' ? 'piano' : 'screen')}
                      data-testid={playOn === 'piano' ? 'lesson-start-screen' : 'lesson-start'}
                    >
                      {t(playOn === 'piano' ? 'lesson.switchToScreen' : 'lesson.switchToPiano')}
                    </Button>
                  </Stack>
                )}
              </Stack>
            </Card>
          )}

          {/* --------------------------------------------------------- play */}
          {/* a lesson in several parts: where the learner is */}
          {phase === 'play' && <LessonParts exercises={lesson.exercises} at={exerciseIndex} />}
          {/* what is new here, for the whole first exercise (no jump while playing) */}
          {phase === 'play' && exerciseIndex === 0 && LESSON_COACH[lesson.id] && (
            <CoachTip text={loc(LESSON_COACH[lesson.id]!)} kids={kids} />
          )}

          {phase === 'play' &&
            (exercise.type === 'find-key' ? (
              <FindKeyExercise key={exerciseIndex} exercise={exercise} {...exerciseProps} />
            ) : exercise.type === 'note-rain' ? (
              <NoteRainExercise key={exerciseIndex} exercise={exercise} {...exerciseProps} />
            ) : exercise.type === 'read-note' ? (
              <ReadNoteExercise key={exerciseIndex} exercise={exercise} {...exerciseProps} />
            ) : exercise.type === 'song' ? (
              <SongExercise key={exerciseIndex} exercise={exercise} {...exerciseProps} />
            ) : exercise.type === 'dynamics' ? (
              <DynamicsExercise key={exerciseIndex} exercise={exercise} {...exerciseProps} />
            ) : exercise.type === 'pedal' ? (
              <PedalExercise key={exerciseIndex} exercise={exercise} {...exerciseProps} />
            ) : exercise.type === 'chords' ? (
              <ChordsExercise key={exerciseIndex} exercise={exercise} {...exerciseProps} />
            ) : exercise.type === 'song-timed' ? (
              <TimedSongExercise key={exerciseIndex} exercise={exercise} {...exerciseProps} />
            ) : exercise.type === 'piece' ? (
              <PieceExercise key={exerciseIndex} exercise={exercise} {...exerciseProps} />
            ) : exercise.type === 'improvise' ? (
              <ImproviseExercise key={exerciseIndex} exercise={exercise} {...exerciseProps} />
            ) : exercise.type === 'rhythm' ? (
              <RhythmExercise key={exerciseIndex} exercise={exercise} {...exerciseProps} />
            ) : exercise.type === 'echo' ? (
              <EchoExercise key={exerciseIndex} exercise={exercise} {...exerciseProps} />
            ) : exercise.type === 'listen' ? (
              <ListenExercise key={exerciseIndex} exercise={exercise} {...exerciseProps} />
            ) : exercise.type === 'sight-read' ? (
              <SightReadExercise key={exerciseIndex} exercise={exercise} {...exerciseProps} />
            ) : (
              <PlayAlongExercise key={exerciseIndex} exercise={exercise} {...exerciseProps} />
            ))}

          {/* ------------------------------------------------------- result */}
          {phase === 'result' && (
            <LessonSummary
              result={result}
              saving={saving}
              error={saveError}
              dailyGoalMinutes={activeProfile?.dailyGoalMinutes ?? 10}
              onRetrySave={() => void save()}
              hardNotes={hardNotes}
              onAgain={onAgain}
              onNext={next ? () => navigate(`/lesson/${next.id}`) : null}
              onPath={() => navigate('/')}
              extra={
                <>
                  {result && result.stars > 0 && finishesWorld(lesson.id, completedBefore) && (
                    <WorldDone lessonId={lesson.id} />
                  )}
                  {activeProfile?.goalSong && result && result.stars > 0 ? (
                    <GoalMilestone
                      goal={activeProfile.goalSong}
                      reached={newlyReachedGoalSkills(
                        activeProfile.goalSong.skills,
                        completedBefore,
                        lesson.id,
                      )}
                      completed={new Set(completedBefore).add(lesson.id)}
                    />
                  ) : null}
                </>
              }
            />
          )}
        </Stack>
      </Box>
      <ConfirmModal
        opened={quitAsk}
        title={t('lesson.quit.title')}
        stay={t('lesson.quit.stay')}
        go={t('lesson.quit.go')}
        onStay={() => setQuitAsk(false)}
        onGo={() => navigate('/')}
        testId="lesson-quit"
      >
        {t('lesson.quit.text')}
      </ConfirmModal>
    </div>
  );
}

function InputInfo({
  mode,
  midiDevice,
  micSupported,
}: {
  mode: LessonInputMode;
  midiDevice: string | null;
  micSupported: boolean;
}) {
  const { t } = useTranslation();
  const { activeProfile } = useSession();
  const location = useLocation();
  if (mode === 'midi') {
    return (
      <Alert color="teal" variant="light" icon={<IconPiano />} w="100%">
        {t('lesson.inputMidi', { device: midiDevice })}
      </Alert>
    );
  }
  if (micSupported) {
    return (
      <Alert color="blue" variant="light" icon={<IconMicrophone />} w="100%">
        {t('lesson.inputMic')}{' '}
        {activeProfile?.calibration.noiseFloorDb == null && (
          <Text span>
            {t('lesson.inputMicSetup')}{' '}
            <Link to="/mic-setup" state={{ from: location.pathname }}>
              {t('mic.setup')}
            </Link>
          </Text>
        )}
      </Alert>
    );
  }
  return (
    <Alert color="gray" variant="light" icon={<IconDeviceDesktop />} w="100%">
      {t('lesson.inputScreen')}
    </Alert>
  );
}

/**
 * «Ich höre: E» – shows each recognised note for a moment, so one always
 * knows the app heard the piano. Before the first note: that it listens.
 */
export function HeardNote({ mode }: { mode: LessonInputMode }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('de') ? 'de' : 'en';
  const [heard, setHeard] = useState<{ midi: number; n: number } | null>(null);
  const [fresh, setFresh] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useNoteEvents((e) => {
    if (e.type !== 'note-on') return;
    setHeard((h) => ({ midi: e.midi, n: (h?.n ?? 0) + 1 }));
    setFresh(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setFresh(false), 1500);
  });
  useEffect(() => () => clearTimeout(timer.current), []);
  if (mode === 'screen' && !heard) return null;
  return (
    <div className={stage.heard} data-fresh={fresh || undefined} aria-hidden data-testid="heard">
      {heard ? (
        <span key={heard.n} className={stage.heardPop}>
          {t('lesson.heard', { note: midiToPitchName(heard.midi, lang) })}
        </span>
      ) : (
        <span>
          {mode === 'midi' ? <IconPiano size={16} /> : <IconMicrophone size={16} />}{' '}
          {t('lesson.waitingForNote')}
        </span>
      )}
    </div>
  );
}

/** During the lesson: which input is listening, and switching mic ↔ screen. */
export function InputSwitch({ input }: { input: ReturnType<typeof useLessonInput> }) {
  const { t } = useTranslation();
  if (input.mode === 'midi') {
    return (
      <Button
        variant="light"
        color="teal"
        leftSection={<IconPiano size={18} />}
        tabIndex={-1}
        component="span"
      >
        <ShortLabel label="MIDI" />
      </Button>
    );
  }
  if (input.mode === 'microphone') {
    return (
      <Button
        variant="light"
        color="teal"
        leftSection={<IconMicrophone size={18} />}
        onClick={input.stopMicrophone}
        title={t('lesson.switchToScreen')}
      >
        <ShortLabel label={t('lesson.micOn')} />
      </Button>
    );
  }
  return input.micSupported ? (
    <Button
      variant="light"
      leftSection={<IconMicrophone size={18} />}
      loading={input.micStatus === 'starting'}
      onClick={input.startMicrophone}
    >
      <ShortLabel label={t('lesson.useMic')} />
    </Button>
  ) : (
    <Button
      variant="light"
      color="gray"
      leftSection={<IconDeviceDesktop size={18} />}
      component="span"
    >
      <ShortLabel label={t('input.source.keyboard')} />
    </Button>
  );
}

/** Button text that collapses to the icon on phones (the name stays for screen readers). */
function ShortLabel({ label }: { label: string }) {
  return (
    <>
      <Box component="span" visibleFrom="xs">
        {label}
      </Box>
      <VisuallyHidden hiddenFrom="xs">{label}</VisuallyHidden>
    </>
  );
}
