import { Card, Group, Progress, SimpleGrid, Text, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import {
  CORE_LESSONS,
  CURRICULUM,
  DEFAULT_JOURNEY_MIN_AGE,
  effectiveWorld,
  findLesson,
  lessonFor,
  liveStreak,
  localIsoDate,
  type ProfileOverviewDto,
} from '@klavio/shared';
import { useSession } from '../auth/session';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { useLocalized } from '../lesson/useLocalized';
import { WeekBars } from './WeekBars';

/** One learner at a glance: where on the path, how much practised lately. */
export function ProgressCard({ data, title }: { data: ProfileOverviewDto; title?: string }) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const p = data.profile;
  const percent = Math.round((data.lessonsDone / CORE_LESSONS.length) * 100);
  const chapter =
    CURRICULUM.find((c) => c.lessons.some((l) => l.id === data.nextLessonId)) ?? CURRICULUM.at(-1)!;
  const thisWeek = data.weeks.at(-1)?.minutes ?? 0;
  const { config } = useSession();
  // the lessons as this learner sees them (grown-ups: their pieces)
  const world = effectiveWorld(p, config?.journeyMinAge ?? DEFAULT_JOURNEY_MIN_AGE);
  const lessonTitle = (id: string) => {
    const l = findLesson(id);
    return l ? loc(lessonFor(l, world).title) : id;
  };
  const today = localIsoDate();
  const streak = liveStreak(p.streak, today);
  const ago = data.lastPracticed
    ? Math.round((Date.parse(today) - Date.parse(data.lastPracticed)) / 86_400_000)
    : null;
  const last =
    ago === null
      ? t('family.never')
      : ago <= 0
        ? t('family.today')
        : ago === 1
          ? t('family.yesterday')
          : t('family.daysAgo', { count: ago });
  return (
    <Card withBorder radius="lg" padding="lg" data-testid={`progress-${p.name}`}>
      <Group gap="md" wrap="nowrap" align="flex-start">
        <ProfileAvatar avatar={p.avatar} outfit={p.outfit} size={56} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Title order={2} size="h3">
            {title ?? p.name}
          </Title>
          <Text size="sm" c="dimmed">
            {t('family.level', { level: p.level, xp: p.xp })} ·{' '}
            {data.nextLessonId ? loc(chapter.title) : t('family.allDone')}
          </Text>
        </div>
      </Group>
      <Group gap="sm" mt="md" wrap="nowrap">
        <Progress
          value={percent}
          size="lg"
          radius="xl"
          style={{ flex: 1 }}
          aria-label={t('family.pathDone', { percent })}
        />
        <Text fw={800} size="sm">
          {percent} %
        </Text>
      </Group>
      <SimpleGrid cols={{ base: 2, xs: 4 }} mt="md" spacing="xs">
        <Stat label={t('family.lessons')} value={`${data.lessonsDone}/${CORE_LESSONS.length}`} />
        <Stat label={t('family.stars')} value={String(data.stars)} />
        <Stat label={t('family.streak')} value={String(streak)} />
        <Stat label={t('family.days')} value={String(data.activeDays)} />
      </SimpleGrid>
      <Text size="sm" mt="md" data-testid="family-last">
        {t('family.lastPracticed', { when: last })}
      </Text>
      {data.nextLessonId && (
        <Text size="sm" data-testid="family-next">
          {t('family.next', { lesson: lessonTitle(data.nextLessonId) })}
        </Text>
      )}
      {data.needsPractice.length > 0 && (
        <Text size="sm" data-testid="family-practice">
          {t('family.needsPractice', {
            lessons: data.needsPractice.map((id) => `«${lessonTitle(id)}»`).join(', '),
          })}
        </Text>
      )}
      <Text fw={700} size="sm" mt="md">
        {t('family.thisWeek', { count: thisWeek })}
      </Text>
      <WeekBars weeks={data.weeks} goalMinutes={p.dailyGoalMinutes} />
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Text fw={900} fz="lg">
        {value}
      </Text>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
    </div>
  );
}
