import { useState } from 'react';
import { Button, Card, Chip, Group, Stack, Text, TextInput, Title } from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { previewPresets, readSeasonPreview, writeSeasonPreview } from '../season/preview';

/**
 * «Festzeit ausprobieren»: see the Advent, Christmas and New Year decoration
 * on any day – on this device only, for admins; everyone else sees today.
 */
export function SeasonPreviewCard() {
  const { t, i18n } = useTranslation();
  const [day, setDay] = useState<string | null>(readSeasonPreview);
  const presets = previewPresets();
  const set = (iso: string | null) => {
    writeSeasonPreview(iso);
    setDay(iso);
  };
  const shown = day
    ? new Date(`${day}T12:00:00`).toLocaleDateString(i18n.language, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <Card withBorder radius="lg" padding="lg" data-testid="season-preview">
      <Stack gap="sm">
        <div>
          <Title order={2} size="h3">
            {t('admin.season.title')}
          </Title>
          <Text size="sm" c="dimmed">
            {t('admin.season.hint')}
          </Text>
        </div>
        <Chip.Group
          value={presets.find((p) => p.iso === day)?.id ?? (day ? '' : 'off')}
          onChange={(v) => {
            const id = Array.isArray(v) ? v[0] : v;
            set(id === 'off' ? null : (presets.find((p) => p.id === id)?.iso ?? null));
          }}
        >
          <Group gap="xs">
            <Chip value="off">{t('admin.season.off')}</Chip>
            {presets.map((p) => (
              <Chip key={p.id} value={p.id}>
                {t(`admin.season.presets.${p.id}`)}
              </Chip>
            ))}
          </Group>
        </Chip.Group>
        <Group align="end" gap="sm">
          <TextInput
            type="date"
            label={t('admin.season.day')}
            value={day ?? ''}
            onChange={(e) => set(e.currentTarget.value || null)}
            data-testid="season-preview-day"
          />
          <Button
            component={Link}
            to="/"
            variant="light"
            rightSection={<IconArrowRight size={18} />}
          >
            {t('admin.season.look')}
          </Button>
        </Group>
        <Text size="sm" aria-live="polite" data-testid="season-preview-state">
          {shown ? t('admin.season.active', { day: shown }) : t('admin.season.inactive')}
        </Text>
      </Stack>
    </Card>
  );
}
