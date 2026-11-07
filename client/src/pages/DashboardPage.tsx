import { Button, Card, Center, Flex, Loader, Paper, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router';
import { IconPlayerPlay } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useSession } from '../auth/session';
import { useMidi } from '../input/useMidi';
import { LESSONS, nextLesson } from '@klavio/shared';
import { LearningPath } from '../lesson/LearningPath';
import { BadgeShelf } from '../lesson/Badges';
import { InstallHint } from '../components/InstallHint';
import { useProgress } from '../lesson/useProgress';
import { useLocalized } from '../lesson/useLocalized';
import { Buddy } from '../components/Buddy';
import { PrivacyNote } from '../components/PrivacyNote';
import { HeroStage } from '../dashboard/HeroStage';
import { StatTiles } from '../dashboard/StatTiles';
import { MicHint } from '../dashboard/MicHint';

/** Home of a learner: greeting, stats, daily goal and the learning path. */
export function DashboardPage() {
  const { t } = useTranslation();
  const { activeProfile } = useSession();
  const midi = useMidi();
  const { progress, completed } = useProgress();
  const loc = useLocalized();
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
      {kids ? (
        <HeroStage
          name={activeProfile.name}
          lesson={progress ? current : null}
          firstTime={completed.size === 0}
          allDone={!!progress && completed.size === LESSONS.length}
          greeting={t('dashboard.mascotKids')}
        />
      ) : (
        <Paper withBorder radius="xl" p="lg">
          {/* stacks on phones, so the button never runs off the card */}
          <Flex
            direction={{ base: 'column', xs: 'row' }}
            gap="md"
            align={{ base: 'flex-start', xs: 'center' }}
          >
            <Buddy mood="happy" size={64} />
            <Stack gap={4} miw={0}>
              <Title order={1} style={{ overflowWrap: 'anywhere' }}>
                {t('dashboard.greeting', { name: activeProfile.name })}
              </Title>
              <Text fz="lg">{t('dashboard.mascotClassic')}</Text>
              {progress && completed.size < LESSONS.length && (
                <Button
                  mt="xs"
                  size="lg"
                  component={Link}
                  to={`/lesson/${current.id}`}
                  leftSection={<IconPlayerPlay />}
                  maw="100%"
                  styles={{
                    label: { whiteSpace: 'normal' },
                    root: { height: 'auto', minHeight: 50 },
                  }}
                >
                  {completed.size === 0
                    ? t('dashboard.startFirst')
                    : t('dashboard.continue', { lesson: loc(current.title) })}
                </Button>
              )}
              {progress && completed.size === LESSONS.length && (
                <Text c="dimmed">{t('dashboard.allDone')}</Text>
              )}
            </Stack>
          </Flex>
        </Paper>
      )}

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
