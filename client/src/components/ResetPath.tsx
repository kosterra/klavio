import { useMemo, useState } from 'react';
import { Button, Group, Select, Stack, Text } from '@mantine/core';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { CURRICULUM, LESSONS, lessonFor } from '@klavio/shared';
import { endpoints } from '../api/endpoints';
import { useErrorText } from '../auth/useErrorText';
import { useLocalized } from '../lesson/useLocalized';
import { useProgress } from '../lesson/useProgress';
import { useWorldMode } from '../lesson/useWorldMode';
import { notify } from './notify';

const CHAPTER = 'chapter:';

/**
 * «Neu beginnen ab …» in the parent area: a lesson (or a whole chapter) and
 * everything after it on the path lose their stars, so the path goes on from
 * there – e.g. when lessons were added before the furthest one played. XP and
 * badges stay. The first lesson missing before the furthest one is preselected.
 */
export function ResetPath() {
  const { t } = useTranslation();
  const loc = useLocalized();
  const world = useWorldMode();
  const navigate = useNavigate();
  const errorText = useErrorText();
  const { played } = useProgress();
  const [choice, setChoice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // lessons not played that come before the furthest one played (bonus lessons don't count)
  const furthest = useMemo(() => LESSONS.findLastIndex((l) => played.has(l.id)), [played]);
  const missing = (id: string) => {
    const i = LESSONS.findIndex((l) => l.id === id);
    return i < furthest && !LESSONS[i]!.bonus && !played.has(id);
  };
  const firstGap = LESSONS.find((l) => missing(l.id));

  const options = CURRICULUM.map((c, ci) => ({
    group: `${t('path.chapter', { n: ci + 1 })} · ${loc(c.title)}`,
    items: [
      { value: CHAPTER + c.id, label: t('placement.resetChapter', { n: ci + 1 }) },
      ...c.lessons.map((l) => ({
        value: l.id,
        label:
          loc(lessonFor(l, world).title) +
          (missing(l.id) ? ` (${t('placement.resetMissing')})` : ''),
      })),
    ],
  }));
  const value = choice ?? firstGap?.id ?? null;
  const lessonId = value?.startsWith(CHAPTER)
    ? CURRICULUM.find((c) => CHAPTER + c.id === value)?.lessons[0]?.id
    : value;
  const label = options.flatMap((g) => g.items).find((o) => o.value === value)?.label;

  const reset = async () => {
    if (!lessonId || !label) return;
    if (!window.confirm(t('placement.resetConfirm', { from: label }))) return;
    setBusy(true);
    try {
      await endpoints.resetProgress(lessonId);
      notify(t('placement.resetDone'));
      navigate('/');
    } catch (err) {
      notify(errorText(err), 'red');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack gap="xs" data-testid="reset-path">
      <div>
        <Text fw={700}>{t('placement.resetTitle')}</Text>
        <Text size="sm" c="dimmed">
          {t(firstGap ? 'placement.resetGaps' : 'placement.resetHint')}
        </Text>
      </div>
      <Group align="flex-end" gap="sm">
        <Select
          label={t('placement.resetLabel')}
          data={options}
          value={value}
          onChange={setChoice}
          size="md"
          style={{ flex: '1 1 260px' }}
          allowDeselect={false}
          searchable
          data-testid="reset-select"
        />
        <Button
          size="md"
          color="red"
          variant="light"
          disabled={!lessonId}
          loading={busy}
          onClick={() => void reset()}
          data-testid="reset-go"
        >
          {t('placement.resetButton')}
        </Button>
      </Group>
    </Stack>
  );
}
