import { Button, Group, Notification } from '@mantine/core';
import { useRegisterSW } from 'virtual:pwa-register/react';

/** Shows a small banner when a new app version has been downloaded. */
export function ReloadPrompt() {
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
      closeButtonProps={{ 'aria-label': 'Schliessen' }}
      onClose={() => setNeedRefresh(false)}
      title="Neue Version verfügbar"
    >
      <Group justify="flex-end" mt="xs">
        <Button size="sm" onClick={() => void updateServiceWorker(true)}>
          Neu laden
        </Button>
      </Group>
    </Notification>
  );
}
