import { useState } from 'react';
import { Button, Card, Group, Select, Stack, Text, Title } from '@mantine/core';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { CURRICULUM } from '@klavio/shared';
import { api } from '../api/client';
import { useErrorText } from '../auth/useErrorText';
import { useLocalized } from '../lesson/useLocalized';
import { notify } from './notify';

/**
 * «Ich kann schon …»: whoever already plays a little starts at a later
 * chapter – the lessons before it count as passed (one star, no XP).
 */
export function PlacementCard() {
  const { t } = useTranslation();
  const loc = useLocalized();
  const navigate = useNavigate();
  const errorText = useErrorText();
  const [chapter, setChapter] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const options = CURRICULUM.slice(1).map((c) => ({
    value: c.id,
    label: `${t('path.chapter', { n: CURRICULUM.indexOf(c) + 1 })} · ${loc(c.title)}`,
  }));
  const place = async () => {
    if (!chapter) return;
    const name = options.find((o) => o.value === chapter)!.label;
    if (!window.confirm(t('placement.confirm', { chapter: name }))) return;
    setBusy(true);
    try {
      await api('POST', '/progress/placement', { chapterId: chapter });
      notify(t('placement.done'));
      navigate('/');
    } catch (err) {
      notify(errorText(err), 'red');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card withBorder radius="lg" padding="lg" data-testid="placement">
      <Stack gap="sm">
        <div>
          <Title order={2} size="h3">
            {t('placement.title')}
          </Title>
          <Text size="sm" c="dimmed">
            {t('placement.hint')}
          </Text>
        </div>
        <Group align="flex-end" gap="sm">
          <Select
            label={t('placement.label')}
            data={options}
            value={chapter}
            onChange={setChapter}
            size="md"
            style={{ flex: '1 1 260px' }}
            allowDeselect={false}
          />
          <Button size="md" disabled={!chapter} loading={busy} onClick={() => void place()}>
            {t('placement.button')}
          </Button>
        </Group>
      </Stack>
    </Card>
  );
}
