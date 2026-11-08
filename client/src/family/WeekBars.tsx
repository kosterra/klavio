import { Text, VisuallyHidden } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import classes from './Family.module.css';

/**
 * Minutes practised per week as small bars (oldest left, this week right),
 * with the daily goal × 5 as a dashed line – a picture, with all numbers in
 * a list for screen readers.
 */
export function WeekBars({
  weeks,
  goalMinutes,
}: {
  weeks: { week: string; minutes: number }[];
  goalMinutes: number;
}) {
  const { t, i18n } = useTranslation();
  const weeklyGoal = goalMinutes * 5;
  const max = Math.max(weeklyGoal, ...weeks.map((w) => w.minutes), 1);
  const fmt = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(i18n.language, {
      day: 'numeric',
      month: 'short',
    });
  return (
    <figure className={classes.chart}>
      <div className={classes.bars} aria-hidden>
        <span className={classes.goal} style={{ bottom: `${(weeklyGoal / max) * 100}%` }} />
        {weeks.map((w, i) => (
          <span key={w.week} className={classes.barCol}>
            <span
              className={classes.bar}
              data-current={i === weeks.length - 1 || undefined}
              style={{ height: `${Math.max(2, (w.minutes / max) * 100)}%` }}
            />
          </span>
        ))}
      </div>
      <figcaption>
        <Text size="xs" c="dimmed">
          {t('family.chartCaption', { goal: weeklyGoal })}
        </Text>
      </figcaption>
      <VisuallyHidden>
        <ul>
          {weeks.map((w) => (
            <li key={w.week}>{t('family.weekMinutes', { week: fmt(w.week), count: w.minutes })}</li>
          ))}
        </ul>
      </VisuallyHidden>
    </figure>
  );
}
