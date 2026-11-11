import { Button, Group, Progress, Text, ThemeIcon, Title, Tooltip } from '@mantine/core';
import { IconArrowRight, IconCheck, IconClock, IconMusicHeart } from '@tabler/icons-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  CURRICULUM,
  SKILL_NAMES,
  findLesson,
  goalProgress,
  isLessonUnlocked,
  nextLesson as nextOnPath,
  lessonsForSkill,
  type GoalSong,
} from '@klavio/shared';
import { chapterColor, worldOf } from '../lesson/worlds';
import { useWorldMode } from '../lesson/useWorldMode';
import { useLocalized } from '../lesson/useLocalized';
import classes from './Goal.module.css';
import { useLessonFor } from '../lesson/useLessonFor';

/**
 * «Mein Traumlied» on the dashboard: how far along the way to the goal song
 * the learner is, the skills it needs (ticked off) and the next step.
 */
export function GoalSongCard({
  goal,
  completed,
  journey,
}: {
  goal: GoalSong;
  completed: Set<string>;
  /** «Die Reise»: the elevation profile to the dream song, inside this card */
  journey?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const forMe = useLessonFor();
  const worldSet = useWorldMode();
  const p = goalProgress(goal.skills, completed);
  const target = p.next ? findLesson(p.next.lessonId) : undefined;
  // the lesson that teaches the next skill may still be locked: then the
  // button leads to the next lesson on the path, the target is named as «later»
  const open = target ? isLessonUnlocked(target.id, completed) : false;
  const nextLesson = target && !open ? nextOnPath(completed) : target;
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
            {p.reached === 0
              ? t('goal.skillsStart', { total: p.total })
              : t('goal.skillsReached', { reached: p.reached, total: p.total })}
          </Text>
        </div>
      </Group>

      {journey}

      <Text size="xs" c="dimmed" mt="md">
        {t('goal.legend')}
      </Text>
      <ul className={classes.skills} aria-label={t('goal.skillsLabel')}>
        {p.skills.map((s) => {
          const name = loc(SKILL_NAMES[s.id]);
          const state = s.reached ? 'reached' : s.taught ? 'open' : 'later';
          // where it is taught: the chapter of its first lesson, in that world's colour
          const first = lessonsForSkill(s.id)[0];
          const ci = first
            ? CURRICULUM.findIndex((c) => c.lessons.some((l) => l.id === first))
            : -1;
          const world = ci >= 0 ? worldOf(CURRICULUM[ci]!.id, ci, worldSet) : null;
          const where = world
            ? t('goal.inChapter', { n: ci + 1, world: t(`path.worlds.${world.id}`) })
            : null;
          const tip = [t(`goal.state.${state}`), where].filter(Boolean).join(' · ');
          return (
            <li key={s.id} data-state={state}>
              <Tooltip label={tip} events={{ hover: true, focus: true, touch: true }}>
                <span className={classes.skill} tabIndex={0}>
                  {world ? (
                    <span
                      className={classes.stone}
                      style={{ background: `var(--mantine-color-${chapterColor(world, ci)}-9)` }}
                      aria-hidden
                    >
                      {s.reached ? <IconCheck size={12} stroke={3} /> : ci + 1}
                    </span>
                  ) : (
                    <IconClock size={14} aria-hidden />
                  )}
                  {name}
                  <span className={classes.srOnly}>, {tip}</span>
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
            {!open && target && (
              <Text span size="sm" fw={400} display="block" data-testid="goal-later">
                {t('goal.later', { lesson: loc(forMe(target).title) })}
              </Text>
            )}
          </Text>
          <Button
            component={Link}
            to={`/lesson/${nextLesson.id}`}
            size="sm"
            color="pink.8"
            rightSection={<IconArrowRight size={16} />}
          >
            {loc(forMe(nextLesson).title)}
          </Button>
        </Group>
      ) : p.reached === p.total ? (
        <div data-testid="goal-ready">
          <Text fw={800} mt="sm">
            {t('goal.ready', { title: goal.title })}
          </Text>
          {/* honest: Klavio teaches the skills, not this song – here is how to go on */}
          <Text size="sm" mt={4}>
            {t('goal.howTo')}
          </Text>
          <ol className={classes.steps}>
            {(['sheet', 'slow', 'metronome', 'teacher'] as const).map((k) => (
              <li key={k}>{t(`goal.howToSteps.${k}`)}</li>
            ))}
          </ol>
          <Button component={Link} to="/metronome" size="sm" variant="light" color="pink.8">
            {t('metronome.open')}
          </Button>
        </div>
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
