import { Button, Group } from '@mantine/core';
import { IconCloudRain, IconMetronome, IconMusic } from '@tabler/icons-react';
import { Link, useLocation } from 'react-router';
import { useMediaQuery } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';

/** «Spielen»: free play, the endless Notenregen and the metronome, one tap apart. */
export function PlayTabs() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  // phones: three tabs side by side, the icon above a short label
  const narrow = useMediaQuery('(max-width: 36em)') ?? false;
  const tabs = [
    { to: '/play', label: t('freePlay.title'), icon: <IconMusic size={18} /> },
    { to: '/play/rain', label: t('rainGame.title'), icon: <IconCloudRain size={18} /> },
    { to: '/play/metronome', label: t('metronome.title'), icon: <IconMetronome size={18} /> },
  ];
  return (
    <Group gap={6} wrap="nowrap" component="nav" aria-label={t('nav.play')} data-testid="play-tabs">
      {tabs.map((tab) => {
        const here = pathname === tab.to;
        return (
          <Button
            key={tab.to}
            component={Link}
            to={tab.to}
            radius="xl"
            size="compact-md"
            px="sm"
            h={narrow ? 'auto' : undefined}
            py={narrow ? 6 : undefined}
            styles={
              narrow
                ? {
                    inner: { flexDirection: 'column', gap: 2 },
                    section: { margin: 0 },
                    label: { whiteSpace: 'normal', fontSize: 13, lineHeight: 1.15 },
                  }
                : undefined
            }
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
