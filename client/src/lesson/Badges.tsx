import { Card, Group, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import {
  IconBook,
  IconFlame,
  IconMetronome,
  IconMusic,
  IconSparkles,
  IconStarFilled,
  IconTarget,
  IconTrophy,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { BADGES, findBadge, type BadgeDef } from '@klavio/shared';
import { useLocalized } from './useLocalized';

const ICONS: Record<BadgeDef['icon'], typeof IconStarFilled> = {
  star: IconStarFilled,
  trophy: IconTrophy,
  music: IconMusic,
  metronome: IconMetronome,
  flame: IconFlame,
  target: IconTarget,
  book: IconBook,
  sparkles: IconSparkles,
};

const COLORS: Record<BadgeDef['icon'], string> = {
  star: 'yellow.8',
  trophy: 'indigo.7',
  music: 'grape.7',
  metronome: 'cyan.8',
  flame: 'orange.8',
  target: 'teal.8',
  book: 'blue.8',
  sparkles: 'pink.7',
};

export function BadgeIcon({
  badge,
  earned,
  size,
}: {
  badge: BadgeDef;
  earned: boolean;
  size: number;
}) {
  const Icon = ICONS[badge.icon];
  return (
    <ThemeIcon
      size={size}
      radius="xl"
      variant={earned ? 'filled' : 'light'}
      color={earned ? COLORS[badge.icon] : 'gray'}
      aria-hidden
    >
      <Icon size={size * 0.55} />
    </ThemeIcon>
  );
}

/** "Neues Abzeichen!" block in the lesson summary. */
export function NewBadges({ ids }: { ids: string[] }) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const badges = ids.map(findBadge).filter((b): b is BadgeDef => !!b);
  if (!badges.length) return null;
  return (
    <Card withBorder radius="lg" padding="md" w="100%" bg="yellow.0" data-testid="new-badges">
      <Text fw={800} mb="xs">
        {t('badges.new', { count: badges.length })}
      </Text>
      <Stack gap="xs">
        {badges.map((b) => (
          <Group key={b.id} gap="sm" wrap="nowrap">
            <BadgeIcon badge={b} earned size={40} />
            <Text fw={700}>{loc(b.title)}</Text>
          </Group>
        ))}
      </Stack>
    </Card>
  );
}

/** All badges: earned ones in colour, open ones grey with how to get them. */
export function BadgeShelf({ earned }: { earned: { id: string; earnedAt: string }[] }) {
  const { t, i18n } = useTranslation();
  const loc = useLocalized();
  const byId = new Map(earned.map((b) => [b.id, b.earnedAt]));
  return (
    <Card withBorder radius="xl" padding="lg">
      <Group justify="space-between" mb="md">
        <Title order={2} size="h3">
          {t('badges.title')}
        </Title>
        <Text c="dimmed" fw={700}>
          {t('badges.count', { earned: byId.size, total: BADGES.length })}
        </Text>
      </Group>
      <SimpleGrid
        cols={{ base: 2, sm: 3, md: 4 }}
        spacing="md"
        component="ul"
        style={{ listStyle: 'none', padding: 0, margin: 0 }}
      >
        {BADGES.map((b) => {
          const at = byId.get(b.id);
          return (
            <Group
              key={b.id}
              component="li"
              gap="sm"
              wrap="nowrap"
              align="flex-start"
              opacity={at ? 1 : 0.85}
              data-testid={`badge-${b.id}`}
              data-earned={at ? 'true' : 'false'}
            >
              <BadgeIcon badge={b} earned={!!at} size={44} />
              <div>
                <Text fw={700} size="sm">
                  {loc(b.title)}
                </Text>
                <Text size="xs" c="dimmed">
                  {at
                    ? t('badges.earnedOn', { date: new Date(at).toLocaleDateString(i18n.language) })
                    : loc(b.hint)}
                </Text>
              </div>
            </Group>
          );
        })}
      </SimpleGrid>
    </Card>
  );
}
