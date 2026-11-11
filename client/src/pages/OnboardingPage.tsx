import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Container,
  Group,
  Progress,
  SimpleGrid,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconBook,
  IconDeviceMobile,
  IconLeaf,
  IconMoodHappy,
  IconMusicHeart,
  IconPiano,
  IconPlugConnected,
  IconUsers,
  type Icon,
} from '@tabler/icons-react';
import { Navigate, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  CURRICULUM,
  type CatalogSong,
  type GoalSong,
  type Motive,
  type SongExercise,
} from '@klavio/shared';
import { useSession } from '../auth/session';
import { endpoints } from '../api/endpoints';
import { useErrorText } from '../auth/useErrorText';
import { BuddySays } from '../components/BuddySays';
import { notify } from '../components/notify';
import { usePageTitle } from '../components/usePageTitle';
import { GoalSongPicks } from '../goal/GoalSongPicks';
import { useLocalized } from '../lesson/useLocalized';
import { Staff, type StaffNote } from '../notation/Staff';
import classes from './OnboardingPage.module.css';

type Instrument = 'acoustic' | 'digital' | 'none';
type Step = 'instrument' | 'motive' | 'goal' | 'week' | 'level' | 'done';

const INSTRUMENTS: { id: Instrument; icon: Icon }[] = [
  { id: 'acoustic', icon: IconPiano },
  { id: 'digital', icon: IconPlugConnected },
  { id: 'none', icon: IconDeviceMobile },
];
const MOTIVE_ICONS: Record<Motive, Icon> = {
  read: IconBook,
  songs: IconMusicHeart,
  relax: IconLeaf,
  fun: IconMoodHappy,
  child: IconUsers,
};
const WEEK_GOALS = [2, 4, 6] as const;

/**
 * «Kannst du das spielen?»: short extracts from our own songs, each harder
 * than the one before. A «yes» skips the chapters it covers.
 */
const LEVELS: { lessonId: string; bars: number; startAt: string }[] = [
  { lessonId: 'song-freude', bars: 2, startAt: 'rhythm' },
  { lessonId: 'bass-lamb', bars: 2, startAt: 'both' },
  { lessonId: 'meter-upbeat', bars: 3, startAt: 'keysigs' },
];

function levelSnippet(lessonId: string, bars: number) {
  const lesson = CURRICULUM.flatMap((c) => c.lessons).find((l) => l.id === lessonId);
  const song = lesson?.exercises.find((e): e is SongExercise => e.type === 'song');
  if (!song) return null;
  return {
    clef: song.clef,
    time: song.time,
    bars: song.bars
      .slice(0, bars)
      .map((bar) => bar.map((n): StaffNote => ({ midi: n.midi, duration: n.value, tie: n.tie }))),
  };
}

/** A big option to tap: icon, name and a line of explanation. */
function Choice({
  icon: IconCmp,
  title,
  hint,
  selected,
  onClick,
  testId,
}: {
  icon: Icon;
  title: string;
  hint?: string;
  selected: boolean;
  onClick: () => void;
  testId?: string;
}) {
  return (
    <UnstyledButton
      className={classes.choice}
      data-selected={selected || undefined}
      aria-pressed={selected}
      onClick={onClick}
      data-testid={testId}
    >
      <span className={classes.choiceIcon} aria-hidden>
        <IconCmp size={30} />
      </span>
      <span>
        <Text fw={800} fz="lg" lh={1.2}>
          {title}
        </Text>
        {hint && (
          <Text size="sm" c="dimmed" mt={2}>
            {hint}
          </Text>
        )}
      </span>
    </UnstyledButton>
  );
}

/**
 * The start of a new profile: a few questions, each with «weiss ich noch
 * nicht». Where the learner plays (sets the lesson start and the microphone
 * set-up), why (Classic), a dream song (Classic), a weekly goal and – for
 * those who already play – where to start. Everything can be changed later.
 */
export function OnboardingPage() {
  const { t } = useTranslation();
  usePageTitle(t('setup.title'));
  const loc = useLocalized();
  const navigate = useNavigate();
  const errorText = useErrorText();
  const { activeProfile, refresh } = useSession();
  const kids = activeProfile?.uiMode === 'kids';

  const steps: Step[] = useMemo(
    () =>
      kids
        ? ['instrument', 'week', 'done']
        : ['instrument', 'motive', 'goal', 'week', 'level', 'done'],
    [kids],
  );
  const [index, setIndex] = useState(0);
  const step = steps[index]!;
  const [instrument, setInstrument] = useState<Instrument | null>(null);
  const [motive, setMotive] = useState<Motive | null>(null);
  const [goal, setGoal] = useState<GoalSong | null>(null);
  const [week, setWeek] = useState<number | null>(null);
  /** how many extracts the learner can play (null: not asked yet / skipped) */
  const [level, setLevel] = useState(0);
  const [levelDone, setLevelDone] = useState(false);
  const [busy, setBusy] = useState(false);

  // every step starts at the top
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [index, level]);

  if (!activeProfile) return null;
  if (activeProfile.setupDone) return <Navigate to="/" replace />;

  const next = () => setIndex((i) => Math.min(i + 1, steps.length - 1));
  const back = () => setIndex((i) => Math.max(i - 1, 0));
  const startChapter = level > 0 ? LEVELS[level - 1]!.startAt : null;
  const startChapterIndex = startChapter ? CURRICULUM.findIndex((c) => c.id === startChapter) : 0;

  const finish = async (answers: boolean, then: string = '/') => {
    setBusy(true);
    try {
      if (answers && startChapter) await endpoints.placement(startChapter);
      await endpoints.updateProfile(activeProfile.id, {
        setupDone: true,
        // where the lessons start: the screen keys without a piano
        ...(instrument ? { playOn: instrument === 'none' ? 'screen' : 'piano' } : {}),
        ...(answers
          ? {
              motive,
              weeklyGoalDays: week,
              ...(goal ? { goalSong: goal } : {}),
            }
          : {}),
      });
      await refresh();
      navigate(then, { replace: true });
    } catch (err) {
      notify(errorText(err), 'red');
      setBusy(false);
    }
  };

  const pickInstrument = (value: Instrument) => {
    setInstrument(value);
    next();
  };
  const pickGoal = (song: CatalogSong) =>
    setGoal({ title: song.title, style: song.style, skills: song.skills });

  const say = t(`setup.${step}.title`);
  const snippet = step === 'level' && !levelDone ? LEVELS[level] : undefined;
  const staff = snippet ? levelSnippet(snippet.lessonId, snippet.bars) : null;

  return (
    <Container size={760} py="lg" className={classes.page} data-testid="setup">
      <Group justify="space-between" wrap="nowrap" mb="md">
        {index > 0 && step !== 'done' ? (
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={20} aria-hidden />}
            onClick={back}
          >
            {t('common.back')}
          </Button>
        ) : (
          <span />
        )}
        {step !== 'done' && (
          <Button
            variant="subtle"
            color="gray"
            onClick={() => void finish(false)}
            loading={busy}
            data-testid="setup-skip"
          >
            {t('setup.skip')}
          </Button>
        )}
      </Group>
      <Progress
        value={((index + 1) / steps.length) * 100}
        size="md"
        radius="xl"
        mb="lg"
        aria-label={t('setup.progress', { n: index + 1, total: steps.length })}
      />

      <Stack gap="lg">
        <BuddySays
          mood={step === 'done' ? 'cheer' : 'happy'}
          size={kids ? 96 : 64}
          kids={kids}
          say={say}
        >
          {index === 0 && (
            <Text fw={800} c="dimmed" ta={kids ? 'center' : undefined}>
              {t('setup.hello', { name: activeProfile.name })}
            </Text>
          )}
          <Title order={1} size="h2" ta={kids ? 'center' : undefined}>
            {say}
          </Title>
          {t(`setup.${step}.hint`, { defaultValue: '' }) && (
            <Text mt={4} ta={kids ? 'center' : undefined}>
              {t(`setup.${step}.hint`)}
            </Text>
          )}
        </BuddySays>

        {step === 'instrument' && (
          <Stack gap="sm">
            {INSTRUMENTS.map((o) => (
              <Choice
                key={o.id}
                icon={o.icon}
                title={t(`setup.instrument.${o.id}`)}
                hint={t(`setup.instrument.${o.id}Hint`)}
                selected={instrument === o.id}
                onClick={() => pickInstrument(o.id)}
                testId={`setup-instrument-${o.id}`}
              />
            ))}
          </Stack>
        )}

        {step === 'motive' && (
          <>
            <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="sm">
              {(Object.keys(MOTIVE_ICONS) as Motive[]).map((m) => (
                <Choice
                  key={m}
                  icon={MOTIVE_ICONS[m]}
                  title={t(`setup.motive.${m}`)}
                  selected={motive === m}
                  onClick={() => {
                    setMotive(m);
                    next();
                  }}
                  testId={`setup-motive-${m}`}
                />
              ))}
            </SimpleGrid>
            <NotSure
              onClick={() => {
                setMotive(null);
                next();
              }}
            />
          </>
        )}

        {step === 'goal' && (
          <>
            <GoalSongPicks value={goal?.title ?? null} onPick={pickGoal} />
            <Text size="sm" c="dimmed">
              {t('setup.goal.other')}
            </Text>
            <Group justify="space-between">
              <NotSure
                onClick={() => {
                  setGoal(null);
                  next();
                }}
              />
              <Button size="lg" disabled={!goal} onClick={next} data-testid="setup-next">
                {t('common.continue')}
              </Button>
            </Group>
          </>
        )}

        {step === 'week' && (
          <>
            <Stack gap="sm">
              {WEEK_GOALS.map((days) => (
                <Choice
                  key={days}
                  icon={IconMoodHappy}
                  title={t(`setup.week.days${days}`)}
                  hint={t(`setup.week.days${days}Hint`)}
                  selected={week === days}
                  onClick={() => {
                    setWeek(days);
                    next();
                  }}
                  testId={`setup-week-${days}`}
                />
              ))}
            </Stack>
            <NotSure
              onClick={() => {
                setWeek(null);
                next();
              }}
            />
          </>
        )}

        {step === 'level' && staff && (
          <Stack gap="md" data-testid="setup-level">
            <div className={classes.staff}>
              <Staff
                clef={staff.clef}
                time={staff.time}
                bars={staff.bars}
                height={170}
                label={t('setup.level.staffLabel')}
              />
            </div>
            <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="sm">
              <Button
                size="lg"
                variant="default"
                onClick={() => {
                  setLevelDone(true);
                  next();
                }}
                data-testid="setup-level-no"
              >
                {level === 0 ? t('setup.level.cantRead') : t('setup.level.notYet')}
              </Button>
              <Button
                size="lg"
                onClick={() => {
                  if (level + 1 >= LEVELS.length) {
                    setLevel(level + 1);
                    setLevelDone(true);
                    next();
                  } else setLevel(level + 1);
                }}
                data-testid="setup-level-yes"
              >
                {t('setup.level.canPlay')}
              </Button>
            </SimpleGrid>
          </Stack>
        )}

        {step === 'done' && (
          <Stack gap="md" data-testid="setup-done">
            <ul className={classes.summary}>
              {instrument && <li>{t(`setup.done.instrument.${instrument}`)}</li>}
              {goal && <li>{t('setup.done.goal', { title: goal.title })}</li>}
              {week && <li>{t('setup.done.week', { count: week })}</li>}
              {!kids && (
                <li data-testid="setup-start-chapter">
                  {startChapter
                    ? t('setup.done.chapter', {
                        n: startChapterIndex + 1,
                        title: loc(CURRICULUM[startChapterIndex]!.title),
                      })
                    : t('setup.done.fromStart')}
                </li>
              )}
            </ul>
            {instrument === 'digital' && <Text>{t('setup.done.midiHow')}</Text>}
            <Text size="sm" c="dimmed">
              {t('setup.done.later')}
            </Text>
            <Group justify="flex-end">
              {startChapter && (
                <Button
                  variant="subtle"
                  onClick={() => {
                    setLevel(0);
                    setLevelDone(true);
                  }}
                >
                  {t('setup.done.fromStartButton')}
                </Button>
              )}
              {instrument === 'acoustic' && (
                <Button
                  size="lg"
                  variant="light"
                  loading={busy}
                  onClick={() => void finish(true, '/mic-setup')}
                  data-testid="setup-mic"
                >
                  {t('setup.done.micSetup')}
                </Button>
              )}
              <Button
                size="lg"
                loading={busy}
                onClick={() => void finish(true)}
                data-testid="setup-finish"
              >
                {t('setup.done.go')}
              </Button>
            </Group>
          </Stack>
        )}
      </Stack>
    </Container>
  );
}

function NotSure({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <Button
      variant="subtle"
      onClick={onClick}
      data-testid="setup-not-sure"
      className={classes.notSure}
    >
      {t('setup.notSure')}
    </Button>
  );
}
