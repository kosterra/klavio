import { Button, Center, Loader, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { Mascot } from './Mascot';

/**
 * While the progress loads: a loader – and if it could not be loaded, Klavi
 * says so and offers to try again (never an endless spinner or a blank page).
 */
export function ProgressPending({
  error,
  onRetry,
  fullPage = false,
}: {
  error: unknown;
  onRetry: () => void;
  fullPage?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Center py="xl" mih={fullPage ? '100dvh' : undefined} px="md">
      {error ? (
        <Stack align="center" gap="sm" data-testid="progress-error">
          <Mascot mood="think" size={96} />
          <Text ta="center" maw={360}>
            {t('common.error')}
          </Text>
          <Button onClick={onRetry}>{t('common.retry')}</Button>
        </Stack>
      ) : (
        <Loader aria-label={t('common.loading')} />
      )}
    </Center>
  );
}
