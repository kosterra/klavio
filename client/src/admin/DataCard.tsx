import { useState } from 'react';
import { Button, Card, Group, NumberInput, Stack, Switch, Text, Title } from '@mantine/core';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { AdminSettingsDto } from '@klavio/shared';

type Change = Partial<Pick<AdminSettingsDto, 'searchIndexing' | 'inactiveDeleteMonths'>>;

/** Search engines and how long unused accounts are kept. */
export function DataCard(props: {
  settings: AdminSettingsDto | null;
  onSave: (change: Change) => Promise<void>;
}) {
  return <DataForm key={props.settings?.inactiveDeleteMonths ?? 'loading'} {...props} />;
}

function DataForm({
  settings,
  onSave,
}: {
  settings: AdminSettingsDto | null;
  onSave: (change: Change) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [months, setMonths] = useState<number | ''>(settings?.inactiveDeleteMonths ?? '');
  const [busy, setBusy] = useState(false);
  const valid =
    typeof months === 'number' && Number.isInteger(months) && months >= 0 && months <= 120;
  const dirty = !!settings && months !== settings.inactiveDeleteMonths;

  return (
    <Card withBorder radius="lg" padding="lg">
      <Stack gap="md">
        <Title order={2} size="h3">
          {t('admin.data.title')}
        </Title>
        <Switch
          label={t('admin.data.indexing')}
          description={t('admin.data.indexingHint')}
          checked={settings?.searchIndexing ?? true}
          disabled={!settings}
          onChange={(e) => void onSave({ searchIndexing: e.currentTarget.checked })}
        />
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!valid) return;
            setBusy(true);
            try {
              await onSave({ inactiveDeleteMonths: months });
            } finally {
              setBusy(false);
            }
          }}
        >
          <Stack gap="sm">
            <NumberInput
              label={t('admin.data.retention')}
              description={t('admin.data.retentionHint')}
              value={months}
              onChange={(v) => setMonths(typeof v === 'number' ? v : '')}
              min={0}
              max={120}
              allowDecimal={false}
              allowNegative={false}
              suffix={` ${t('admin.data.months')}`}
              styles={{ wrapper: { maxWidth: 260 } }}
              size="md"
              disabled={!settings}
              error={months !== '' && !valid ? t('admin.data.invalid') : undefined}
            />
            <Text size="sm" c="dimmed">
              {months === 0 ? t('admin.data.never') : t('admin.data.howItWorks')}
            </Text>
            <Group>
              <Button
                type="submit"
                size="md"
                leftSection={<IconDeviceFloppy size={18} />}
                disabled={!dirty || !valid}
                loading={busy}
              >
                {t('common.save')}
              </Button>
            </Group>
          </Stack>
        </form>
      </Stack>
    </Card>
  );
}
