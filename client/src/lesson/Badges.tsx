import { useId } from 'react';
import { Card, Group, Popover, Stack, Text, Title, UnstyledButton } from '@mantine/core';
import {
  IconBook,
  IconFlame,
  IconMetronome,
  IconMusic,
  IconRepeat,
  IconSparkles,
  IconStarFilled,
  IconTarget,
  IconTrophy,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { BADGES, findBadge, type BadgeDef } from '@klavio/shared';
import { useLocalized } from './useLocalized';
import classes from './Badges.module.css';

const ICONS: Record<BadgeDef['icon'], typeof IconStarFilled> = {
  star: IconStarFilled,
  trophy: IconTrophy,
  music: IconMusic,
  metronome: IconMetronome,
  flame: IconFlame,
  target: IconTarget,
  book: IconBook,
  sparkles: IconSparkles,
  repeat: IconRepeat,
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
  repeat: 'lime.8',
};

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
            <Medal badge={b} earned size={48} />
            <Text fw={700}>{loc(b.title)}</Text>
          </Group>
        ))}
      </Stack>
    </Card>
  );
}

/**
 * A medal with ribbons (own drawing): gold with the badge's colour and icon
 * once earned, a grey silhouette with a question mark before.
 */
function Medal({ badge, earned, size }: { badge: BadgeDef; earned: boolean; size: number }) {
  const Icon = ICONS[badge.icon];
  const gold = useId();
  const color = COLORS[badge.icon].split('.')[0]!;
  const ribbon = earned ? `var(--mantine-color-${color}-6)` : 'var(--klavio-locked-border)';
  const ribbonDark = earned ? `var(--mantine-color-${color}-8)` : 'var(--klavio-locked-border)';
  return (
    <span className={classes.medal} style={{ width: size, height: size * 1.2 }} aria-hidden>
      <svg viewBox="0 0 80 96" width={size} height={size * 1.2}>
        <path d="M22 0 H38 L33 40 L16 34 Z" fill={ribbon} />
        <path d="M42 0 H58 L64 34 L47 40 Z" fill={ribbonDark} />
        <circle
          cx="40"
          cy="58"
          r="32"
          fill={earned ? `url(#${gold})` : 'var(--klavio-locked-bg)'}
          stroke={earned ? 'var(--mantine-color-yellow-8)' : 'var(--klavio-locked-border)'}
          strokeWidth="3"
          strokeDasharray={earned ? undefined : '6 5'}
        />
        <circle cx="40" cy="58" r="23" fill={earned ? `var(--mantine-color-${color}-6)` : 'none'} />
        {earned && (
          <path
            d="M24 46 Q30 36 42 34"
            stroke="rgb(255 255 255 / 60%)"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
        )}
        <defs>
          <linearGradient id={gold} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--mantine-color-yellow-3)" />
            <stop offset="0.6" stopColor="var(--mantine-color-yellow-5)" />
            <stop offset="1" stopColor="var(--mantine-color-orange-5)" />
          </linearGradient>
        </defs>
      </svg>
      <span className={classes.medalIcon} style={{ top: size * 0.725 }}>
        {earned ? (
          <Icon size={size * 0.34} color="#fff" />
        ) : (
          <Text component="span" fw={900} fz={size * 0.36} c="var(--klavio-locked-fg)">
            ?
          </Text>
        )}
      </span>
    </span>
  );
}

/**
 * All badges as a shelf of medals to collect: earned ones shine, open ones are
 * silhouettes. A tap shows how to get a medal (or when it was earned).
 */
export function BadgeShelf({ earned }: { earned: { id: string; earnedAt: string }[] }) {
  const { t, i18n } = useTranslation();
  const loc = useLocalized();
  const byId = new Map(earned.map((b) => [b.id, b.earnedAt]));
  return (
    <Card withBorder radius="xl" padding="lg" className={classes.shelf}>
      <Group justify="space-between" mb="md">
        <Title order={2} size="h3">
          {t('badges.title')}
        </Title>
        <Text fw={800} className={classes.count}>
          {t('badges.count', { earned: byId.size, total: BADGES.length })}
        </Text>
      </Group>
      <ul className={classes.grid}>
        {BADGES.map((b) => {
          const at = byId.get(b.id);
          const detail = at
            ? t('badges.earnedOn', { date: new Date(at).toLocaleDateString(i18n.language) })
            : loc(b.hint);
          return (
            <li key={b.id} data-testid={`badge-${b.id}`} data-earned={at ? 'true' : 'false'}>
              <Popover width={220} position="bottom" withArrow shadow="md">
                <Popover.Target>
                  <UnstyledButton
                    className={classes.medalButton}
                    data-earned={at ? 'true' : undefined}
                    aria-label={`${loc(b.title)}: ${detail}`}
                  >
                    <Medal badge={b} earned={!!at} size={64} />
                    <Text size="sm" fw={700} ta="center" lh={1.2} className={classes.medalTitle}>
                      {loc(b.title)}
                    </Text>
                  </UnstyledButton>
                </Popover.Target>
                <Popover.Dropdown>
                  <Text fw={800}>{loc(b.title)}</Text>
                  <Text size="sm">{detail}</Text>
                </Popover.Dropdown>
              </Popover>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
