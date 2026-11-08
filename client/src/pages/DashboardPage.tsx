import { Card, Center, Loader, Stack, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useSession } from '../auth/session';
import { useMidi } from '../input/useMidi';
import { LESSONS, nextLesson } from '@klavio/shared';
import { LearningPath } from '../lesson/LearningPath';
import { BadgeShelf } from '../lesson/Badges';
import { InstallHint } from '../components/InstallHint';
import { useProgress } from '../lesson/useProgress';
import { useWorldMode } from '../lesson/useWorldMode';
import { PrivacyNote } from '../components/PrivacyNote';
import { HeroStage } from '../dashboard/HeroStage';
import { StatTiles } from '../dashboard/StatTiles';
import { MicHint } from '../dashboard/MicHint';
import { ReviewCard } from '../dashboard/ReviewCard';
import { GoalSongCard, GoalSongPrompt } from '../goal/GoalSongCard';
import { JourneyProfile } from '../dashboard/JourneyProfile';

/** Home of a learner: greeting, stats, daily goal and the learning path. */
export function DashboardPage() {
  const { t } = useTranslation();
  const { activeProfile } = useSession();
  const midi = useMidi();
  const { progress, completed } = useProgress();
  const worldSet = useWorldMode();
  if (!activeProfile) return null;
  const current = nextLesson(completed);
  const todayMinutes = Math.floor((progress?.today.seconds ?? 0) / 60);
  const kids = activeProfile.uiMode === 'kids';

  const pathTitle = (
    <Title order={2} size="h3">
      {t('dashboard.learnPath')}
    </Title>
  );
  return (
    <Stack gap="lg" maw={1100} mx="auto">
      <InstallHint />
      {/* both modes: the greeting is a stage in the colours of the current world */}
      <HeroStage
        name={activeProfile.name}
        lesson={progress ? current : null}
        firstTime={completed.size === 0}
        allDone={!!progress && completed.size === LESSONS.length}
        greeting={kids ? t('dashboard.mascotKids') : t('dashboard.mascotClassic')}
      />

      {activeProfile.goalSong ? (
        <GoalSongCard goal={activeProfile.goalSong} completed={completed} />
      ) : (
        !kids && <GoalSongPrompt />
      )}

      {/* adults: the way down into «Die Hölle» and up to the dream song */}
      {worldSet === 'journey' && progress && (
        <JourneyProfile
          completed={completed}
          currentLessonId={current.id}
          goalTitle={activeProfile.goalSong?.title}
        />
      )}

      {progress && <ReviewCard progress={progress} />}

      <StatTiles
        xp={activeProfile.xp}
        level={activeProfile.level}
        streak={activeProfile.streak.current}
        todayMinutes={todayMinutes}
        goalMinutes={activeProfile.dailyGoalMinutes}
      />

      {activeProfile.calibration.noiseFloorDb === null && midi.devices.length === 0 && (
        <MicHint profileId={activeProfile.id} />
      )}

      {/* the path's worlds fill the whole panel, the heading sits on the first one */}
      <Card withBorder radius="xl" padding={0}>
        {progress ? (
          <LearningPath
            progress={progress.lessons}
            currentLessonId={current.id}
            avatar={activeProfile.avatar}
            profileId={activeProfile.id}
            title={pathTitle}
            worlds={worldSet}
          />
        ) : (
          <Stack p="lg">
            {pathTitle}
            <Center py="xl">
              <Loader aria-label={t('common.loading')} />
            </Center>
          </Stack>
        )}
      </Card>

      <BadgeShelf earned={activeProfile.badges} />

      <PrivacyNote />
    </Stack>
  );
}
