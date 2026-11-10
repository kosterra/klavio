import { Group, Paper, Text } from '@mantine/core';
import { IconBulb } from '@tabler/icons-react';
import { ReadAloudButton } from '../components/ReadAloud';
import classes from './CoachTip.module.css';

/**
 * Klavi's hint in the exercise itself: one sentence about what is new here,
 * shown during the first exercise of the lesson. Read aloud on request (the task itself
 * is read automatically – two voices at once would be too much).
 */
export function CoachTip({ text, kids }: { text: string; kids: boolean }) {
  return (
    <Paper className={classes.tip} role="note" data-testid="coach-tip">
      <Group gap="sm" wrap="nowrap" align="center">
        <span className={classes.icon} aria-hidden>
          <IconBulb size={kids ? 28 : 24} />
        </span>
        <Text fz={kids ? 'lg' : 'md'} fw={600} style={{ flex: 1 }}>
          {text}
        </Text>
        <ReadAloudButton text={text} size={kids ? 'lg' : 'md'} />
      </Group>
    </Paper>
  );
}
