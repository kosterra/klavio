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
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  LESSONS,
  applyCompletion,
  chapterOf,
  findLesson,
  isLessonUnlocked,
  lessonTargetCount,
  levelForXp,
  localIsoDate,
  nextStreak,
  starsFor,
  newlyReachedGoalSkills,
  recapFor,
  theoryFor,
  xpFor,
  type Lesson,
  type LessonResultDto,
  type ProfileDto,
  type ProgressDto,
} from '@klavio/shared';
import { ApiError } from '../api/client';
import { enqueueResult } from '../offline/queue';
import { endpoints } from '../api/endpoints';
import { useSession } from '../auth/session';
import { useErrorText } from '../auth/useErrorText';
import { useMicErrorText } from '../audio/micErrorText';
import { Buddy } from '../components/Buddy';
import { PrivacyBadge } from '../components/PrivacyNote';
import { FindKeyExercise } from '../lesson/FindKeyExercise';
import { PlayAlongExercise } from '../lesson/PlayAlongExercise';
import { ReadNoteExercise } from '../lesson/ReadNoteExercise';
import { SongExercise } from '../lesson/SongExercise';
import { RhythmExercise } from '../lesson/RhythmExercise';
import { LessonSummary } from '../lesson/LessonSummary';
import { useLessonInput, type LessonInputMode } from '../lesson/useLessonInput';
import { useLocalized } from '../lesson/useLocalized';
import { loadProgress, useProgress } from '../lesson/useProgress';
import { TheorySteps } from '../lesson/theory/TheorySteps';
import { GoalMilestone } from '../goal/GoalMilestone';
import { Scenery } from '../lesson/WorldScenery';
import { worldOfLesson } from '../lesson/worlds';
import stage from '../lesson/LessonStage.module.css';

type ShownResult = LessonResultDto & { pending?: boolean };

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
  const stars = starsFor(lessonTargetCount(lesson), body.mistakes);
  const previousBest = before.lessons[lesson.id]?.bestStars ?? 0;
  const { wasDue, bonusXp } = applyCompletion(before.lessons[lesson.id], stars, body.localDate);
  const xpGained = xpFor(lesson.xp, stars, previousBest) + bonusXp;
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
export function LessonPage() {
  const { lessonId = '' } = useParams();
  // Remount per lesson so "next lesson" loads fresh progress for the unlock check.
  return <LessonGate key={lessonId} lessonId={lessonId} />;
}

function LessonGate({ lessonId }: { lessonId: string }) {
  const lesson = findLesson(lessonId);
  const { completed, progress } = useProgress();
  const [attempt, setAttempt] = useState(0);

  if (!lesson) return <Navigate to="/" replace />;
  if (!progress) return null; // short wait for the unlock check
  if (!isLessonUnlocked(lesson.id, completed)) return <Navigate to="/" replace />;
  return (
    <LessonRun
      key={`${lesson.id}-${attempt}`}
      lesson={lesson}
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
  const { t } = useTranslation();
  const loc = useLocalized();
  const navigate = useNavigate();
  const errorText = useErrorText();
  const micErrorText = useMicErrorText();
  const { me, activeProfile, refresh, applyLocalResult } = useSession();
  const input = useLessonInput();
  const kids = activeProfile?.uiMode !== 'classic';
  const theory = theoryFor(lesson.id);
  // first visit: "Weisst du's noch?" (start of a chapter) + the lesson's theory
  const [steps, setSteps] = useState(() =>
    discoverFirst ? [...recapFor(lesson.id), ...theory] : theory,
  );
  const [phase, setPhase] = useState<'theory' | 'intro' | 'play' | 'result'>(
    discoverFirst && steps.length ? 'theory' : 'intro',
  );
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const mistakes = useRef(0);
  const startedAt = useRef(0);
  const [result, setResult] = useState<ShownResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const total = lessonTargetCount(lesson);
  const chapter = chapterOf(lesson.id);
  const where = worldOfLesson(lesson.id);
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
    try {
      setResult(await endpoints.completeLesson(lesson.id, body));
      await refresh(); // XP, level and streak on the dashboard
    } catch (err) {
      if (err instanceof ApiError && err.code === 'NETWORK' && me && activeProfile) {
        // Offline: keep the result on the device and show it right away.
        const before = await loadProgress(activeProfile.id);
        enqueueResult({
          ...body,
          userId: me.user.id,
          profileId: activeProfile.id,
          lessonId: lesson.id,
        });
        const local = localResult(lesson, body, activeProfile, before);
        applyLocalResult(activeProfile.id, {
          xp: local.xp,
          level: local.level,
          streak: local.streak,
        });
        setResult(local);
      } else {
        setSaveError(errorText(err));
      }
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
    onCorrect: () => setCorrect((c) => c + 1),
    onMistake: () => {
      mistakes.current++;
    },
    onDone: finishExercise,
  };

  return (
    <div
      className={kids ? stage.stage : undefined}
      style={kids ? where.vars : undefined}
      data-world={kids ? where.world.id : undefined}
    >
      {kids && (
        <div className={stage.scenery} aria-hidden>
          <Scenery world={where.world.id} chapterId="lesson" height={40} />
        </div>
      )}
      <Box mih="100dvh" p="md" maw={1100} mx="auto" pos="relative">
        <Stack gap="md">
          {/* ------------------------------------------------------ top bar */}
          <Group justify="space-between" wrap="nowrap" gap="sm">
            <CloseButton size="xl" aria-label={t('lesson.close')} onClick={() => navigate('/')} />
            <Progress
              value={phase === 'result' ? 100 : (correct / total) * 100}
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

          {input.micError && phase === 'play' && (
            <Alert color="orange">
              {micErrorText(input.micError)} {t('lesson.useScreen')}
            </Alert>
          )}

          {/* ------------------------------------------- theory ("Entdecken") */}
          {phase === 'theory' && (
            <TheorySteps steps={steps} kids={kids} onDone={() => setPhase('intro')} />
          )}

          {/* -------------------------------------------------------- intro */}
          {phase === 'intro' && (
            <Card withBorder radius="xl" padding="xl" maw={640} mx="auto" w="100%">
              <Stack align="center" gap="md">
                <Buddy mood="happy" size={kids ? 120 : 80} />
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
                <InputInfo
                  mode={input.mode}
                  midiDevice={input.midiDevice}
                  micSupported={input.micSupported}
                />
                {theory.length > 0 && (
                  <Button
                    variant="subtle"
                    onClick={() => {
                      setSteps(theory);
                      setPhase('theory');
                    }}
                    data-testid="theory-again"
                  >
                    {t('theory.again')}
                  </Button>
                )}
                <Button
                  size="xl"
                  mt="sm"
                  onClick={() => {
                    input.startPreferred();
                    startedAt.current = performance.now();
                    setPhase('play');
                  }}
                >
                  {t('lesson.start')}
                </Button>
              </Stack>
            </Card>
          )}

          {/* --------------------------------------------------------- play */}
          {phase === 'play' &&
            (exercise.type === 'find-key' ? (
              <FindKeyExercise key={exerciseIndex} exercise={exercise} {...exerciseProps} />
            ) : exercise.type === 'read-note' ? (
              <ReadNoteExercise key={exerciseIndex} exercise={exercise} {...exerciseProps} />
            ) : exercise.type === 'song' ? (
              <SongExercise key={exerciseIndex} exercise={exercise} {...exerciseProps} />
            ) : exercise.type === 'rhythm' ? (
              <RhythmExercise key={exerciseIndex} exercise={exercise} {...exerciseProps} />
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
              onAgain={onAgain}
              onNext={next ? () => navigate(`/lesson/${next.id}`) : null}
              onPath={() => navigate('/')}
              extra={
                activeProfile?.goalSong && result && result.stars > 0 ? (
                  <GoalMilestone
                    goal={activeProfile.goalSong}
                    reached={newlyReachedGoalSkills(
                      activeProfile.goalSong.skills,
                      completedBefore,
                      lesson.id,
                    )}
                    completed={new Set(completedBefore).add(lesson.id)}
                  />
                ) : null
              }
            />
          )}
        </Stack>
      </Box>
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
            {t('lesson.inputMicSetup')} <Link to="/mic-setup">{t('mic.setup')}</Link>
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

/** During the lesson: which input is listening, and switching mic ↔ screen. */
function InputSwitch({ input }: { input: ReturnType<typeof useLessonInput> }) {
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
