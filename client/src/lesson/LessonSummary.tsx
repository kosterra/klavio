import { Alert, Button, Card, Group, Stack, Text, Title } from '@mantine/core';
import {
  IconCloudUpload,
  IconFlame,
  IconRefresh,
  IconStarFilled,
  IconTrophy,
  IconRepeat,
} from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { REVIEW_BONUS_XP } from '@klavio/shared';
import type { LessonResultDto } from '@klavio/shared';
import { Buddy } from '../components/Buddy';
import { NewBadges } from './Badges';

interface Props {
  result: (LessonResultDto & { pending?: boolean }) | null;
  saving: boolean;
  error: string | null;
  dailyGoalMinutes: number;
  onRetrySave: () => void;
  onAgain: () => void;
  onNext: (() => void) | null;
  onPath: () => void;
  /** e.g. the goal-song milestone */
  extra?: ReactNode;
}

/** End of a lesson: stars, XP, level, streak, daily goal — friendly, never shaming. */
export function LessonSummary({
  result,
  saving,
  error,
  dailyGoalMinutes,
  onRetrySave,
  onAgain,
  onNext,
  onPath,
  extra,
}: Props) {
  const { t } = useTranslation();
  const stars = result?.stars ?? 0;
  const minutes = result ? Math.floor(result.today.seconds / 60) : 0;

  return (
    <Card withBorder radius="xl" padding="xl" maw={560} mx="auto" w="100%">
      <Stack align="center" gap="md">
        <Buddy mood="cheer" size={120} />
        <Title order={1} ta="center">
          {result ? t(`lesson.result${stars}`) : t('lesson.finished')}
        </Title>

        {result && (
          <>
            <Group gap="xs" role="img" aria-label={t('path.stars', { count: stars })}>
              {[1, 2, 3].map((s) => (
                <IconStarFilled
                  key={s}
                  size={56}
                  color={s <= stars ? 'var(--mantine-color-yellow-6)' : 'var(--klavio-empty-star)'}
                  aria-hidden
                />
              ))}
            </Group>
            {stars < 3 && <Text c="dimmed">{t('lesson.moreStars')}</Text>}
            <Text fz={28} fw={800} c="indigo.8" data-testid="xp-gained">
              {t('lesson.xpGained', { xp: result.xpGained })}
            </Text>
            {extra}
            {result.review && (
              <Alert
                color="teal"
                variant="light"
                icon={<IconRepeat />}
                radius="lg"
                w="100%"
                data-testid="review-done"
              >
                <Text fw={700}>{t('review.done', { xp: REVIEW_BONUS_XP })}</Text>
              </Alert>
            )}
            {result.pending && (
              <Alert
                color="blue"
                icon={<IconCloudUpload />}
                radius="lg"
                w="100%"
                data-testid="pending"
              >
                {t('offline.pendingResult')}
              </Alert>
            )}
            <NewBadges ids={result.newBadges} />
            {result.leveledUp && (
              <Alert color="yellow" icon={<IconTrophy />} radius="lg" w="100%">
                <Text fw={800}>{t('lesson.levelUp', { level: result.level })}</Text>
              </Alert>
            )}
            <Group gap="lg" justify="center">
              <Group gap={6}>
                <IconFlame color="var(--mantine-color-orange-7)" aria-hidden />
                <Text fw={700}>{t('dashboard.streak', { count: result.streak.current })}</Text>
              </Group>
              <Text fw={700}>{t('lesson.todayMinutes', { minutes, goal: dailyGoalMinutes })}</Text>
            </Group>
          </>
        )}

        {saving && <Text c="dimmed">{t('common.loading')}</Text>}
        {error && (
          <Alert color="red" role="alert" w="100%">
            <Stack gap="xs">
              <Text>{error}</Text>
              <Button
                variant="white"
                color="red"
                leftSection={<IconRefresh />}
                onClick={onRetrySave}
              >
                {t('lesson.retrySave')}
              </Button>
            </Stack>
          </Alert>
        )}

        <Stack w="100%" gap="sm" mt="sm">
          {onNext && result && (
            <Button size="lg" onClick={onNext}>
              {t('lesson.next')}
            </Button>
          )}
          <Group grow>
            <Button variant="light" onClick={onAgain} disabled={saving}>
              {t('lesson.again')}
            </Button>
            <Button variant="default" onClick={onPath} disabled={saving}>
              {t('lesson.toPath')}
            </Button>
          </Group>
        </Stack>
      </Stack>
    </Card>
  );
}
