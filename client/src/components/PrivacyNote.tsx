import { ActionIcon, Alert, Badge, Tooltip } from '@mantine/core';
import { IconMicrophone, IconShieldLock } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useSession } from '../auth/session';

/** The "audio never leaves your device" promise, shown wherever audio is involved. */
export function PrivacyNote() {
  const { t } = useTranslation();
  return (
    <Alert variant="light" color="teal" icon={<IconShieldLock aria-hidden />} radius="lg">
      {t('privacy.audioLocal')}
    </Alert>
  );
}

export function PrivacyBadge() {
  const { t } = useTranslation();
  const { activeProfile } = useSession();
  if (activeProfile?.uiMode === 'kids') {
    // kids: just a small shield – the promise is for the parents, a tap shows it
    return (
      <Tooltip
        label={t('privacy.audioLocal')}
        multiline
        w={260}
        events={{ hover: true, focus: true, touch: true }}
      >
        <ActionIcon
          variant="light"
          color="teal"
          radius="xl"
          size="lg"
          aria-label={t('privacy.audioLocalShort')}
        >
          <IconShieldLock size={20} aria-hidden />
        </ActionIcon>
      </Tooltip>
    );
  }
  return (
    <Tooltip
      label={t('privacy.audioLocal')}
      multiline
      w={260}
      events={{ hover: true, focus: true, touch: true }}
    >
      <Badge
        variant="light"
        color="teal"
        size="lg"
        leftSection={<IconMicrophone size={16} aria-hidden />}
        tabIndex={0}
        visibleFrom="sm"
      >
        {t('privacy.audioLocalShort')}
      </Badge>
    </Tooltip>
  );
}
