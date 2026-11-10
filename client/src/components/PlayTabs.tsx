import { Button, Group } from '@mantine/core';
import { IconCloudRain, IconMusic } from '@tabler/icons-react';
import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';

/** «Spielen»: free play and the endless Notenregen, one tap apart. */
export function PlayTabs() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const tabs = [
    { to: '/play', label: t('freePlay.title'), icon: <IconMusic size={18} /> },
    { to: '/play/rain', label: t('rainGame.title'), icon: <IconCloudRain size={18} /> },
  ];
  return (
    <Group
      gap="xs"
      wrap="nowrap"
      component="nav"
      aria-label={t('nav.play')}
      data-testid="play-tabs"
    >
      {tabs.map((tab) => {
        const here = pathname === tab.to;
        return (
          <Button
            key={tab.to}
            component={Link}
            to={tab.to}
            radius="xl"
            size="sm"
            variant={here ? 'filled' : 'default'}
            leftSection={tab.icon}
            aria-current={here ? 'page' : undefined}
          >
            {tab.label}
          </Button>
        );
      })}
    </Group>
  );
}
