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
      <Group gap="sm" wrap="wrap" justify="space-between" className={classes.row}>
        <Group gap="sm" wrap="nowrap" className={classes.text}>
          <span className={classes.icon} aria-hidden>
            <IconRocket size={24} />
          </span>
          <Text fw={600} role={failed ? 'status' : undefined}>
            {failed ? (
              t('skipCheck.failed')
            ) : (
              <>
                <span className={classes.long}>{t('skipCheck.offer')}</span>
                {/* phones: one short line, so the explanation below still fits */}
                <span className={classes.short}>{t('skipCheck.offerShort')}</span>
              </>
            )}
          </Text>
        </Group>
        {!failed && (
          <Button
            variant="light"
            size="md"
            onClick={onStart}
            className={classes.button}
            data-testid="skip-check"
          >
            {t('skipCheck.start')}
          </Button>
        )}
      </Group>
    </Paper>
  );
}
