import { Box, Group, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';

/** Horizontal tuning meter: −50 … +50 cents, green inside the tolerance. */
export function CentsMeter({ cents, tolerance }: { cents: number | null; tolerance: number }) {
  const { t } = useTranslation();
  const clamped = cents === null ? 0 : Math.max(-50, Math.min(50, cents));
  const inTune = cents !== null && Math.abs(cents) <= tolerance;
  return (
    <Box>
      <Box
        role="meter"
        aria-label={t('mic.centsLabel')}
        aria-valuemin={-50}
        aria-valuemax={50}
        aria-valuenow={cents ?? 0}
        aria-valuetext={cents === null ? t('mic.noNote') : t('mic.cents', { cents })}
        pos="relative"
        h={28}
        style={{
          borderRadius: 14,
          background: 'var(--mantine-color-gray-2)',
          overflow: 'hidden',
        }}
      >
        <Box
          pos="absolute"
          top={0}
          bottom={0}
          left={`${50 - tolerance}%`}
          w={`${tolerance * 2}%`}
          style={{ background: 'var(--mantine-color-teal-1)' }}
        />
        <Box
          pos="absolute"
          top={0}
          bottom={0}
          left="50%"
          w={2}
          style={{ background: 'var(--mantine-color-gray-5)' }}
        />
        {cents !== null && (
          <Box
            pos="absolute"
            top={2}
            bottom={2}
            w={8}
            left={`calc(${50 + clamped}% - 4px)`}
            style={{
              borderRadius: 4,
              background: inTune ? 'var(--mantine-color-teal-8)' : 'var(--mantine-color-orange-8)',
            }}
          />
        )}
      </Box>
      <Group justify="space-between" mt={4}>
        <Text size="xs" c="dimmed">
          −50
        </Text>
        <Text size="sm" fw={700}>
          {cents === null ? '–' : t('mic.cents', { cents: cents > 0 ? `+${cents}` : cents })}
        </Text>
        <Text size="xs" c="dimmed">
          +50
        </Text>
      </Group>
    </Box>
  );
}

const MIN_DB = -90;

/** Input level in dBFS with a marker for the noise gate. */
export function LevelMeter({ levelDb, gateDb }: { levelDb: number; gateDb: number }) {
  const { t } = useTranslation();
  const pct = (db: number) => ((Math.max(MIN_DB, Math.min(0, db)) - MIN_DB) / -MIN_DB) * 100;
  const above = levelDb >= gateDb;
  return (
    <Box>
      <Box
        role="meter"
        aria-label={t('mic.levelLabel')}
        aria-valuemin={MIN_DB}
        aria-valuemax={0}
        aria-valuenow={Math.round(levelDb)}
        aria-valuetext={`${Math.round(levelDb)} dBFS`}
        pos="relative"
        h={20}
        style={{
          borderRadius: 10,
          background: 'var(--mantine-color-gray-2)',
          overflow: 'hidden',
        }}
      >
        <Box
          h="100%"
          w={`${pct(levelDb)}%`}
          style={{
            background: above ? 'var(--mantine-color-teal-7)' : 'var(--mantine-color-gray-5)',
          }}
        />
        <Box
          pos="absolute"
          top={0}
          bottom={0}
          left={`${pct(gateDb)}%`}
          w={2}
          style={{ background: 'var(--mantine-color-dark-6)' }}
        />
      </Box>
      <Group justify="space-between" mt={4}>
        <Text size="xs" c="dimmed">
          {t('mic.quiet')}
        </Text>
        <Text size="sm">{Math.round(levelDb)} dBFS</Text>
        <Text size="xs" c="dimmed">
          {t('mic.loud')}
        </Text>
      </Group>
    </Box>
  );
}
