import { useState } from 'react';
import { Button, CloseButton, Group, Text, ThemeIcon } from '@mantine/core';
import { IconMicrophone } from '@tabler/icons-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import classes from './Dashboard.module.css';

const KEY = 'klavio-mic-hint-hidden';

function hiddenFor(profileId: string): boolean {
  try {
    return (JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[]).includes(profileId);
  } catch {
    return false;
  }
}

/**
 * A compact, dismissable reminder to set up the microphone (mostly for
 * parents). Lessons still explain the input, so hiding it is harmless.
 */
export function MicHint({ profileId }: { profileId: string }) {
  const { t } = useTranslation();
  const [hidden, setHidden] = useState(() => hiddenFor(profileId));
  if (hidden) return null;
  const hide = () => {
    setHidden(true);
    try {
      const ids = JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[];
      localStorage.setItem(KEY, JSON.stringify([...new Set([...ids, profileId])]));
    } catch {
      // storage unavailable: hidden for this visit only
    }
  };
  return (
    <div className={classes.micHint} role="region" aria-label={t('mic.setup')}>
      <ThemeIcon size={40} radius="xl" variant="light" color="blue" aria-hidden>
        <IconMicrophone size={22} />
      </ThemeIcon>
      <Text size="sm" fw={600} className={classes.micText}>
        {t('dashboard.micSetupShort')}
      </Text>
      <Group gap="xs" wrap="nowrap">
        <Button size="sm" component={Link} to="/mic-setup" state={{ from: '/' }}>
          {t('mic.setup')}
        </Button>
        <Button size="sm" variant="subtle" component={Link} to="/input" visibleFrom="xs">
          {t('dashboard.otherInputs')}
        </Button>
      </Group>
      <CloseButton onClick={hide} aria-label={t('dashboard.hideHint')} />
    </div>
  );
}
