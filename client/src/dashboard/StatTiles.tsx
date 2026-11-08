import { Group, Progress, RingProgress, SimpleGrid, Text, ThemeIcon } from '@mantine/core';
import { IconFlameFilled, IconStarFilled, IconTrophyFilled } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { xpForLevel } from '@klavio/shared';
import classes from './Dashboard.module.css';

/** Tiles in a soft tint of their colour, with a matching border. */
function tileStyle(color: string): React.CSSProperties {
  return {
    // opaque tint, so the page's doodles don't shine through
    background: `color-mix(in srgb, var(--mantine-color-${color}-6) 14%, var(--klavio-surface))`,
    borderColor: `color-mix(in srgb, var(--mantine-color-${color}-6) 35%, var(--klavio-surface))`,
  };
}

/**
 * What the learner has achieved, as things to see rather than numbers: a bar
 * to the next level, a flame that grows with the streak, a ring that turns
 * into a star when today's goal is reached.
 */
export function StatTiles({
  xp,
  level,
  streak,
  todayMinutes,
  goalMinutes,
}: {
  xp: number;
  level: number;
  streak: number;
  todayMinutes: number;
  goalMinutes: number;
}) {
  const { t } = useTranslation();
  const from = xpForLevel(level);
  const to = xpForLevel(level + 1);
  const levelPct = Math.min(100, ((xp - from) / (to - from)) * 100);
  const goalPct = Math.min(100, (todayMinutes / goalMinutes) * 100);
  const goalDone = goalPct >= 100;
  // the flame grows with the streak (up to a week)
  const flame = 30 + Math.min(streak, 7) * 4;

  return (
    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
      <div className={classes.tile} style={tileStyle('indigo')}>
        <ThemeIcon size={52} radius="xl" color="indigo" aria-hidden>
          <IconTrophyFilled size={28} />
        </ThemeIcon>
        <div className={classes.tileBody}>
          <Group gap="xs" align="baseline" wrap="nowrap">
            <Text fw={800} fz="xl" lh={1.1}>
              {t('dashboard.level', { level })}
            </Text>
            <Text size="sm" fw={700} data-testid="xp-total">
              {t('dashboard.xpTotal', { xp })}
            </Text>
          </Group>
          <Progress
            value={levelPct}
            color="indigo"
            size="lg"
            radius="xl"
            mt={6}
            aria-label={t('dashboard.xpToNext', { xp: to - xp, next: level + 1 })}
            className={classes.levelBar}
          />
          <Text size="sm" fw={600} mt={4}>
            {t('dashboard.xpToNext', { xp: to - xp, next: level + 1 })}
          </Text>
        </div>
      </div>

      <div className={classes.tile} style={tileStyle('orange')}>
        <div className={classes.flameBox} aria-hidden>
          <IconFlameFilled size={flame} className={streak > 0 ? classes.flame : classes.flameOut} />
        </div>
        <div className={classes.tileBody}>
          <Text fw={800} fz="xl" lh={1.1}>
            {t('dashboard.streak', { count: streak })}
          </Text>
          <Text size="sm" fw={600} mt={4}>
            {streak > 0 ? t('dashboard.streakKeep') : t('dashboard.streakZero')}
          </Text>
        </div>
      </div>

      <div className={classes.tile} style={tileStyle('teal')}>
        <RingProgress
          size={72}
          thickness={9}
          roundCaps
          sections={[{ value: goalPct, color: 'teal' }]}
          rootColor="var(--klavio-surface)"
          role="img"
          aria-label={t('dashboard.todayGoal', { minutes: todayMinutes, goal: goalMinutes })}
          label={
            goalDone ? (
              <IconStarFilled
                size={30}
                color="var(--mantine-color-yellow-5)"
                className={classes.goalStar}
                style={{ display: 'block', margin: '0 auto' }}
              />
            ) : undefined
          }
        />
        <div className={classes.tileBody}>
          <Text fw={800} fz="xl" lh={1.1}>
            {goalDone
              ? t('dashboard.goalReached')
              : t('dashboard.dailyGoal', { minutes: goalMinutes })}
          </Text>
          <Text size="sm" fw={600} mt={4}>
            {t('dashboard.todayGoal', { minutes: todayMinutes, goal: goalMinutes })}
          </Text>
        </div>
      </div>
    </SimpleGrid>
  );
}
