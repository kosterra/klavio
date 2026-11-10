import { Group, Text } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { Exercise } from '@klavio/shared';
import classes from './LessonParts.module.css';

/**
 * A lesson with several parts (e.g. read, then catch the note rain): where
 * the learner is – done, now, still to come.
 */
export function LessonParts({ exercises, at }: { exercises: Exercise[]; at: number }) {
  const { t } = useTranslation();
  if (exercises.length < 2) return null;
  return (
    <Group
      component="ol"
      gap={6}
      justify="center"
      className={classes.parts}
      aria-label={t('lesson.parts.label', { n: at + 1, total: exercises.length })}
      data-testid="lesson-parts"
    >
      {exercises.map((e, i) => (
        <li
          key={i}
          className={classes.part}
          data-state={i < at ? 'done' : i === at ? 'now' : 'next'}
          aria-current={i === at ? 'step' : undefined}
        >
          {i < at && <IconCheck size={14} aria-hidden />}
          <Text span size="sm" fw={700}>
            {t(`lesson.parts.${e.type}`)}
          </Text>
        </li>
      ))}
    </Group>
  );
}
