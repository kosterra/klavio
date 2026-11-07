import {
  Alert,
  Button,
  Card,
  Group,
  Paper,
  RingProgress,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { Link } from 'react-router';
import { IconFlame, IconMicrophone, IconStar, IconTrophy } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useSession } from '../auth/session';
import { Mascot } from '../components/Mascot';
import { PrivacyNote } from '../components/PrivacyNote';

/** Empty dashboard scaffold — the learning path is filled in with the curriculum (step 6). */
export function DashboardPage() {
  const { t } = useTranslation();
  const { activeProfile } = useSession();
  if (!activeProfile) return null;
  const kids = activeProfile.uiMode === 'kids';

  return (
    <Stack gap="lg" maw={1100} mx="auto">
      <Paper withBorder radius="xl" p="lg">
        <Group wrap="nowrap" align="center">
          <Mascot mood="happy" size={kids ? 110 : 64} />
          <Stack gap={4}>
            <Title order={1}>{t('dashboard.greeting', { name: activeProfile.name })}</Title>
            <Text fz="lg">{kids ? t('dashboard.mascotKids') : t('dashboard.mascotClassic')}</Text>
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
          label={t('dashboard.streakLabel')}
        />
        <Card withBorder radius="lg" padding="md">
          <Group gap="sm" wrap="nowrap">
            <RingProgress size={64} thickness={8} sections={[{ value: 0, color: 'teal' }]} />
            <Text fw={600}>
              {t('dashboard.dailyGoal', { minutes: activeProfile.dailyGoalMinutes })}
            </Text>
          </Group>
        </Card>
      </SimpleGrid>

      {activeProfile.calibration.noiseFloorDb === null && (
        <Alert color="blue" variant="light" icon={<IconMicrophone />} radius="lg">
          <Group justify="space-between" gap="sm">
            <Text>{t('dashboard.micSetup')}</Text>
            <Button component={Link} to="/mic-setup">
              {t('mic.setup')}
            </Button>
          </Group>
        </Alert>
      )}

      <Card withBorder radius="xl" padding="lg">
        <Title order={2} size="h3" mb="sm">
          {t('dashboard.learnPath')}
        </Title>
        <Text c="dimmed">{t('dashboard.comingSoon')}</Text>
      </Card>

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
