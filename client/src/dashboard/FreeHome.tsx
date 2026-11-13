import { useState } from 'react';
import { Button, Card, Collapse, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import {
  IconChevronDown,
  IconChevronUp,
  IconCloudRain,
  IconMetronome,
  IconMusic,
  IconPlaylist,
} from '@tabler/icons-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import { Buddy } from '../components/Buddy';
import { OwnPieces } from '../own/OwnPieces';
import classes from './FreeHome.module.css';

/**
 * The start page without the learning path (advanced players): the own
 * pieces first, the tools one tap away, and every lesson still there to pick
 * – folded away, all of them open.
 */
export function FreeHome({ name, path }: { name: string; path: ReactNode }) {
  const { t } = useTranslation();
  const [lessons, setLessons] = useState(false);
  const tiles = [
    { to: '/songs', icon: <IconPlaylist size={26} />, label: t('nav.songs') },
    { to: '/play', icon: <IconMusic size={26} />, label: t('freePlay.title') },
    { to: '/play/rain', icon: <IconCloudRain size={26} />, label: t('freeHome.rain') },
    { to: '/play/metronome', icon: <IconMetronome size={26} />, label: t('freeHome.metronome') },
  ];
  return (
    <Stack gap="lg" data-testid="free-home">
      <Card withBorder radius="xl" padding="lg">
        <Group gap="md" wrap="nowrap" align="center">
          <Buddy mood="happy" size={72} />
          <div>
            <Title order={1} size="h2">
              {t('dashboard.greeting', { name })}
            </Title>
            <Text>{t('freeHome.intro')}</Text>
          </div>
        </Group>
        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm" mt="md">
          {tiles.map((x) => (
            <Button
              key={x.to}
              component={Link}
              to={x.to}
              variant="default"
              size="lg"
              className={classes.tile}
              leftSection={x.icon}
            >
              {x.label}
            </Button>
          ))}
        </SimpleGrid>
      </Card>

      <Card withBorder radius="xl" padding="lg">
        <OwnPieces />
      </Card>

      <Card withBorder radius="xl" padding={0}>
        <Button
          variant="subtle"
          size="lg"
          fullWidth
          justify="space-between"
          onClick={() => setLessons((v) => !v)}
          aria-expanded={lessons}
          aria-controls="free-lessons"
          rightSection={lessons ? <IconChevronUp /> : <IconChevronDown />}
          data-testid="free-lessons-toggle"
        >
          {t('freeHome.lessons')}
        </Button>
        <Collapse expanded={lessons} id="free-lessons">
          {lessons && path}
        </Collapse>
      </Card>
    </Stack>
  );
}
