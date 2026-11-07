import { Button, Group, Notification } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useRegisterSW } from 'virtual:pwa-register/react';

/** Shows a small banner when a new app version has been downloaded. */
export function ReloadPrompt() {
  const { t } = useTranslation();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;
  return (
    <Notification
      pos="fixed"
      bottom={16}
      right={16}
      style={{ zIndex: 1000 }}
      withCloseButton
      closeButtonProps={{ 'aria-label': t('common.close') }}
      onClose={() => setNeedRefresh(false)}
      title={t('update.title')}
    >
      <Group justify="flex-end" mt="xs">
        <Button size="sm" onClick={() => void updateServiceWorker(true)}>
          {t('update.reload')}
        </Button>
      </Group>
    </Notification>
  );
}
