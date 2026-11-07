import {
  Alert,
  Button,
  Card,
  Center,
  Group,
  Loader,
  Paper,
  RingProgress,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { Link } from 'react-router';
import {
  IconFlame,
  IconMicrophone,
  IconPlayerPlay,
  IconStar,
  IconTrophy,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useSession } from '../auth/session';
import { useMidi } from '../input/useMidi';
import { LESSONS, nextLesson } from '@klavio/shared';
import { LearningPath } from '../lesson/LearningPath';
import { BadgeShelf } from '../lesson/Badges';
import { useProgress } from '../lesson/useProgress';
import { useLocalized } from '../lesson/useLocalized';
import { Mascot } from '../components/Mascot';
import { PrivacyNote } from '../components/PrivacyNote';

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
  const goalPct = Math.min(
    100,
    ((progress?.today.seconds ?? 0) / (activeProfile.dailyGoalMinutes * 60)) * 100,
  );
  const kids = activeProfile.uiMode === 'kids';

  return (
    <Stack gap="lg" maw={1100} mx="auto">
      <Paper withBorder radius="xl" p="lg">
        <Group wrap="nowrap" align="center">
          <Mascot mood="happy" size={kids ? 110 : 64} />
          <Stack gap={4}>
            <Title order={1}>{t('dashboard.greeting', { name: activeProfile.name })}</Title>
            <Text fz="lg">{kids ? t('dashboard.mascotKids') : t('dashboard.mascotClassic')}</Text>
            {progress && (
              <Group mt="xs">
                <Button
                  size="lg"
                  component={Link}
                  to={`/lesson/${current.id}`}
                  leftSection={<IconPlayerPlay />}
                >
                  {completed.size === 0
                    ? t('dashboard.startFirst')
                    : t('dashboard.continue', { lesson: loc(current.title) })}
                </Button>
              </Group>
            )}
            {progress && completed.size === LESSONS.length && (
              <Text c="dimmed">{t('dashboard.allDone')}</Text>
            )}
          </Stack>
        </Group>
      </Paper>

      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
        <Stat
          icon={<IconStar color="var(--mantine-color-yellow-6)" />}
          value={activeProfile.xp}
          label={t('dashboard.xp')}
        />
        <Stat
          icon={<IconTrophy color="var(--mantine-color-indigo-6)" />}
          value={activeProfile.level}
          label={t('dashboard.levelLabel')}
        />
        <Stat
          icon={<IconFlame color="var(--mantine-color-orange-6)" />}
          value={activeProfile.streak.current}
          label={t('dashboard.streakLabel', { count: activeProfile.streak.current })}
        />
        <Card withBorder radius="lg" padding="md">
          <Group gap="sm" wrap="nowrap">
            <RingProgress
              size={64}
              thickness={8}
              roundCaps
              sections={[{ value: goalPct, color: 'teal' }]}
              role="img"
              aria-label={t('dashboard.todayGoal', {
                minutes: todayMinutes,
                goal: activeProfile.dailyGoalMinutes,
              })}
            />
            <div>
              <Text fw={700}>
                {goalPct >= 100
                  ? t('dashboard.goalReached')
                  : t('dashboard.dailyGoal', { minutes: activeProfile.dailyGoalMinutes })}
              </Text>
              <Text size="sm" c="dimmed">
                {t('dashboard.todayGoal', {
                  minutes: todayMinutes,
                  goal: activeProfile.dailyGoalMinutes,
                })}
              </Text>
            </div>
          </Group>
        </Card>
      </SimpleGrid>

      {activeProfile.calibration.noiseFloorDb === null && midi.devices.length === 0 && (
        <Alert color="blue" variant="light" icon={<IconMicrophone />} radius="lg">
          <Group justify="space-between" gap="sm">
            <Text>{t('dashboard.micSetup')}</Text>
            <Group gap="xs">
              <Button component={Link} to="/mic-setup">
                {t('mic.setup')}
              </Button>
              <Button variant="subtle" component={Link} to="/input">
                {t('dashboard.otherInputs')}
              </Button>
            </Group>
          </Group>
        </Alert>
      )}

      <Card withBorder radius="xl" padding="lg">
        <Title order={2} size="h3" mb="lg">
          {t('dashboard.learnPath')}
        </Title>
        {progress ? (
          <LearningPath progress={progress.lessons} currentLessonId={current.id} />
        ) : (
          <Center py="xl">
            <Loader aria-label={t('common.loading')} />
          </Center>
        )}
      </Card>

      <BadgeShelf earned={activeProfile.badges} />

      <PrivacyNote />
    </Stack>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <Card withBorder radius="lg" padding="md">
      <Group gap="sm" wrap="nowrap">
        {icon}
        <div>
          <Text fz={28} fw={800} lh={1}>
            {value}
          </Text>
          <Text size="sm" c="dimmed">
            {label}
          </Text>
        </div>
      </Group>
    </Card>
  );
}
