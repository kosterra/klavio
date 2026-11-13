import { useState } from 'react';
import { Button, Card, Divider, Group, Select, Stack, Switch, Text, Title } from '@mantine/core';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { CURRICULUM } from '@klavio/shared';
import { api } from '../api/client';
import { useErrorText } from '../auth/useErrorText';
import { useLocalized } from '../lesson/useLocalized';
import { notify } from './notify';
import { useSession } from '../auth/session';
import { endpoints } from '../api/endpoints';

/**
 * «Lernpfad» in the parent area: whoever already plays starts at a later
 * stage or chapter – the lessons before it count as passed (one star, no XP) –
 * or switches the path off altogether: every lesson open, the start page
 * shows the pieces.
 */
export function PlacementCard() {
  const { t } = useTranslation();
  const loc = useLocalized();
  const navigate = useNavigate();
  const errorText = useErrorText();
  const [chapter, setChapter] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { activeProfile, refresh } = useSession();
  const [savingOff, setSavingOff] = useState(false);
  // the chapters by stage: the first chapter of a stage skips whole stages
  const options = ([1, 2, 3] as const)
    .map((stage) => ({
      group: t(`path.stages.${stage}`),
      items: CURRICULUM.filter((c, i) => i > 0 && c.stage === stage).map((c) => ({
        value: c.id,
        label: `${t('path.chapter', { n: CURRICULUM.indexOf(c) + 1 })} · ${loc(c.title)}`,
      })),
    }))
    .filter((g) => g.items.length > 0);
  const all = options.flatMap((g) => g.items);
  const setPathOff = async (off: boolean) => {
    if (!activeProfile) return;
    setSavingOff(true);
    try {
      await endpoints.updateProfile(activeProfile.id, { pathOff: off });
      await refresh();
      notify(t(off ? 'placement.offDone' : 'placement.onDone'));
    } catch (err) {
      notify(errorText(err), 'red');
    } finally {
      setSavingOff(false);
    }
  };
  const place = async () => {
    if (!chapter) return;
    const name = all.find((o) => o.value === chapter)!.label;
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
        <Switch
          size="lg"
          label={t('placement.pathOn')}
          description={t('placement.pathOnHint')}
          checked={!activeProfile?.pathOff}
          disabled={savingOff}
          onChange={(e) => void setPathOff(!e.currentTarget.checked)}
          data-testid="path-switch"
        />
        <Divider />
        <Group align="flex-end" gap="sm">
          <Select
            label={t('placement.label')}
            data={options}
            disabled={!!activeProfile?.pathOff}
            data-testid="placement-select"
            value={chapter}
            onChange={setChapter}
            size="md"
            style={{ flex: '1 1 260px' }}
            allowDeselect={false}
          />
          <Button
            size="md"
            disabled={!chapter || !!activeProfile?.pathOff}
            loading={busy}
            onClick={() => void place()}
            data-testid="placement-go"
          >
            {t('placement.button')}
          </Button>
        </Group>
      </Stack>
    </Card>
  );
}
