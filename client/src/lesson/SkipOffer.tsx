import { Button, Group, Paper, Text } from '@mantine/core';
import { IconRocket } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import classes from './SkipOffer.module.css';

/**
 * «Kennst du das schon?»: a lesson with a check can be skipped by whoever
 * answers its questions right at the first try. After a failed check it says
 * so kindly – and the lesson simply goes on.
 */
export function SkipOffer({ onStart, failed }: { onStart: () => void; failed: boolean }) {
  const { t } = useTranslation();
  return (
    <Paper className={classes.offer} data-testid="skip-offer">
      <Group gap="sm" wrap="wrap" justify="space-between">
        <Group gap="sm" wrap="nowrap" style={{ flex: '1 1 16rem' }}>
          <span className={classes.icon} aria-hidden>
            <IconRocket size={24} />
          </span>
          <Text fw={600} role={failed ? 'status' : undefined}>
            {t(failed ? 'skipCheck.failed' : 'skipCheck.offer')}
          </Text>
        </Group>
        {!failed && (
          <Button variant="light" size="md" onClick={onStart} data-testid="skip-check">
            {t('skipCheck.start')}
          </Button>
        )}
      </Group>
    </Paper>
  );
}
