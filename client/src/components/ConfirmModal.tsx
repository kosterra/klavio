import type { ReactNode } from 'react';
import { Button, Group, Modal, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';

/**
 * «Really?» before something that cannot be undone. The safe choice comes
 * first and is the big one; the other one says what happens.
 */
export function ConfirmModal({
  opened,
  title,
  children,
  stay,
  go,
  onStay,
  onGo,
  danger = false,
  busy = false,
  testId,
}: {
  opened: boolean;
  title: string;
  children?: ReactNode;
  /** label of the safe choice (stays, closes the dialog) */
  stay: string;
  /** label of the action */
  go: string;
  onStay: () => void;
  onGo: () => void;
  danger?: boolean;
  busy?: boolean;
  testId?: string;
}) {
  const { t } = useTranslation();
  return (
    <Modal
      opened={opened}
      onClose={onStay}
      title={title}
      radius="lg"
      centered
      closeButtonProps={{ 'aria-label': t('common.close') }}
      data-testid={testId}
    >
      <Stack>
        {typeof children === 'string' ? <Text>{children}</Text> : children}
        <Group grow wrap="wrap">
          <Button onClick={onStay} data-autofocus>
            {stay}
          </Button>
          <Button
            variant="default"
            color={danger ? 'red' : undefined}
            c={danger ? 'var(--klavio-danger)' : undefined}
            loading={busy}
            onClick={onGo}
            data-testid={testId ? `${testId}-go` : undefined}
          >
            {go}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
