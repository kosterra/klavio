import { Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { SKILL_NAMES, goalProgress, type GoalSong, type SkillId } from '@klavio/shared';
import { useLocalized } from '../lesson/useLocalized';
import classes from './Goal.module.css';

/** Result screen: "One step closer to <goal song>" when a lesson completed a skill it needs. */
export function GoalMilestone({
  goal,
  reached,
  completed,
}: {
  goal: GoalSong;
  reached: SkillId[];
  completed: Set<string>;
}) {
  const { t } = useTranslation();
  const loc = useLocalized();
  if (!reached.length) return null;
  const p = goalProgress(goal.skills, completed);
  return (
    <div className={classes.milestone} data-testid="goal-milestone">
      <Text fw={900} fz="lg">
        {t('goal.closer', { title: goal.title })}
      </Text>
      <Text fw={600}>
        {t('goal.nowYouCan', { skills: reached.map((s) => loc(SKILL_NAMES[s])).join(', ') })}
      </Text>
      <Text size="sm" fw={700} mt={4}>
        {t('goal.percentOfWay', { percent: p.percent })}
      </Text>
    </div>
  );
}
