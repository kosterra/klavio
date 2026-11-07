import { Button, Group, Progress, Text, ThemeIcon, Title, Tooltip } from '@mantine/core';
import { IconArrowRight, IconCheck, IconClock, IconMusicHeart } from '@tabler/icons-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { SKILL_NAMES, findLesson, goalProgress, type GoalSong } from '@klavio/shared';
import { useLocalized } from '../lesson/useLocalized';
import classes from './Goal.module.css';

/**
 * «Mein Traumlied» on the dashboard: how far along the way to the goal song
 * the learner is, the skills it needs (ticked off) and the next step.
 */
export function GoalSongCard({ goal, completed }: { goal: GoalSong; completed: Set<string> }) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const p = goalProgress(goal.skills, completed);
  const nextLesson = p.next ? findLesson(p.next.lessonId) : undefined;
  return (
    <section className={classes.card} aria-labelledby="goal-title" data-testid="goal-card">
      <Group gap="sm" wrap="nowrap" align="flex-start">
        <ThemeIcon size={48} radius="xl" color="pink.7" aria-hidden>
          <IconMusicHeart size={26} />
        </ThemeIcon>
        <div className={classes.body}>
          <Text size="sm" fw={800} tt="uppercase" className={classes.kicker}>
            {t('goal.kicker')}
          </Text>
          <Title order={2} size="h3" id="goal-title" className={classes.title}>
            {goal.title}
          </Title>
          <Group gap="sm" wrap="nowrap" mt={6}>
            <Progress
              value={p.percent}
              color="pink.6"
              size="xl"
              radius="xl"
              className={classes.bar}
              aria-label={t('goal.percent', { percent: p.percent })}
            />
            <Text fw={800} data-testid="goal-percent">
              {p.percent} %
            </Text>
          </Group>
          <Text size="sm" fw={600} mt={4}>
            {t('goal.skillsReached', { reached: p.reached, total: p.total })}
          </Text>
        </div>
      </Group>

      <ul className={classes.skills} aria-label={t('goal.skillsLabel')}>
        {p.skills.map((s) => {
          const name = loc(SKILL_NAMES[s.id]);
          const state = s.reached ? 'reached' : s.taught ? 'open' : 'later';
          return (
            <li key={s.id} data-state={state}>
              <Tooltip
                label={t(`goal.state.${state}`)}
                events={{ hover: true, focus: true, touch: true }}
              >
                <span className={classes.skill} tabIndex={0}>
                  {s.reached ? (
                    <IconCheck size={14} aria-hidden />
                  ) : s.taught ? null : (
                    <IconClock size={14} aria-hidden />
                  )}
                  {name}
                  <span className={classes.srOnly}>, {t(`goal.state.${state}`)}</span>
                </span>
              </Tooltip>
            </li>
          );
        })}
      </ul>

      {p.next && nextLesson ? (
        <Group justify="space-between" gap="sm" mt="sm" wrap="wrap">
          <Text size="sm" fw={700}>
            {t('goal.next', { skill: loc(SKILL_NAMES[p.next.skill]) })}
          </Text>
          <Button
            component={Link}
            to={`/lesson/${nextLesson.id}`}
            size="sm"
            color="pink.8"
            rightSection={<IconArrowRight size={16} />}
          >
            {loc(nextLesson.title)}
          </Button>
        </Group>
      ) : p.reached === p.total ? (
        <Text fw={800} mt="sm">
          {t('goal.ready', { title: goal.title })}
        </Text>
      ) : (
        <Text size="sm" fw={600} mt="sm">
          {t('goal.waiting')}
        </Text>
      )}
    </section>
  );
}

/** For learners without a goal song (adults): a small invitation. */
export function GoalSongPrompt() {
  const { t } = useTranslation();
  return (
    <section className={classes.prompt} data-testid="goal-prompt">
      <IconMusicHeart size={24} aria-hidden className={classes.promptIcon} />
      <Text fw={700} className={classes.promptText}>
        {t('goal.promptText')}
      </Text>
      <Button component={Link} to="/profile#goal" variant="default" size="sm">
        {t('goal.promptButton')}
      </Button>
    </section>
  );
}
