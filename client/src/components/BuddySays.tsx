import type { ReactNode } from 'react';
import { Group, Stack } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import type { MascotMood } from './Mascot';
import { Buddy } from './Buddy';
import classes from './BuddySays.module.css';

/**
 * The learner's figure saying something: in kids mode the task sits in a
 * speech bubble next to the figure, in classic mode figure and text are
 * simply stacked.
 */
export function BuddySays({
  mood,
  size,
  kids,
  classicRow = false,
  children,
}: {
  mood: MascotMood;
  size: number;
  kids: boolean;
  /** classic mode: figure beside the text instead of above it */
  classicRow?: boolean;
  children: ReactNode;
}) {
  // phones: a smaller figure leaves room for the speech bubble
  const narrow = useMediaQuery('(max-width: 36em)') ?? false;
  if (!kids && classicRow) {
    return (
      <Group justify="center" gap="md" wrap="nowrap">
        <Buddy mood={mood} size={size} />
        {children}
      </Group>
    );
  }
  if (!kids) {
    return (
      <Stack align="center" gap="sm">
        <Buddy mood={mood} size={size} />
        {children}
      </Stack>
    );
  }
  return (
    <div className={classes.row}>
      <div className={classes.figure}>
        <Buddy mood={mood} size={narrow ? Math.min(size, 56) : size} />
      </div>
      <div className={classes.bubble}>{children}</div>
    </div>
  );
}
