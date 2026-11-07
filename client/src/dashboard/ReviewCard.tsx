import { Box, Button, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconBolt, IconPlayerPlay, IconRepeat } from '@tabler/icons-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { findLesson, localIsoDate, reviewQueue, type ProgressDto } from '@klavio/shared';
import { useLocalized } from '../lesson/useLocalized';
import { worldOfLesson } from '../lesson/worlds';
import classes from './Dashboard.module.css';

/**
 * "Heute wiederholen": lessons that are due again (flash-card style), at most
 * three, the most overdue first. When nothing is due, a quick mixed round.
 */
export function ReviewCard({ progress }: { progress: ProgressDto }) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const played = Object.values(progress.lessons).some((l) => l.bestStars > 0);
  if (!played) return null;
  const due = reviewQueue(progress.lessons, localIsoDate());

  return (
    <section className={classes.review} aria-labelledby="review-title" data-testid="review-card">
      <Group gap="sm" wrap="nowrap" mb="sm">
        <ThemeIcon size={44} radius="xl" color="lime.8" aria-hidden>
          <IconRepeat size={24} />
        </ThemeIcon>
        <div>
          <Title order={2} size="h4" id="review-title">
            {due.length ? t('review.title') : t('review.allFresh')}
          </Title>
          <Text size="sm" fw={600}>
            {due.length ? t('review.intro') : t('review.quickIntro')}
          </Text>
        </div>
      </Group>
      {due.length > 0 ? (
        <Stack gap="xs" component="ul" className={classes.reviewList}>
          {due.map(({ lessonId, daysAgo }) => {
            const lesson = findLesson(lessonId)!;
            const where = worldOfLesson(lessonId);
            return (
              <li key={lessonId} style={where.vars} className={classes.reviewItem}>
                <div className={classes.reviewText}>
                  <Text fw={800}>{loc(lesson.title)}</Text>
                  <Text size="sm" fw={600}>
                    {t(`path.worlds.${where.world.id}`)} · {t('review.daysAgo', { count: daysAgo })}
                  </Text>
                </div>
                <Button
                  component={Link}
                  to={`/lesson/${lessonId}`}
                  leftSection={<IconPlayerPlay size={18} />}
                  aria-label={t('review.play', { lesson: loc(lesson.title) })}
                  data-testid={`review-${lessonId}`}
                  // phones: only the icon, so the lesson name keeps its room
                  px={{ base: 'sm', xs: 'lg' }}
                >
                  <Box component="span" visibleFrom="xs">
                    {t('review.go')}
                  </Box>
                </Button>
              </li>
            );
          })}
        </Stack>
      ) : null}
      <Button
        component={Link}
        to="/quick"
        // a quiet second choice while reviews are due, the main action otherwise
        variant={due.length ? 'default' : 'filled'}
        leftSection={<IconBolt size={18} />}
        mt={due.length ? 'xs' : 0}
        data-testid="quick-round"
      >
        {t('review.quick')}
      </Button>
    </section>
  );
}
