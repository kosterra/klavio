import { useState } from 'react';
import { Button, Card, Group, NumberInput, Stack, Text, Title } from '@mantine/core';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { AdminSettingsDto } from '@klavio/shared';

/** From which age profiles can choose between the kids' worlds and the journey. */
export function WorldsCard(props: {
  settings: AdminSettingsDto | null;
  onSave: (journeyMinAge: number) => Promise<void>;
}) {
  return <WorldsForm key={props.settings?.journeyMinAge ?? 'loading'} {...props} />;
}

function WorldsForm({
  settings,
  onSave,
}: {
  settings: AdminSettingsDto | null;
  onSave: (journeyMinAge: number) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [age, setAge] = useState<number | ''>(settings?.journeyMinAge ?? '');
  const [busy, setBusy] = useState(false);
  const valid = typeof age === 'number' && Number.isInteger(age) && age >= 0 && age <= 99;
  const dirty = !!settings && age !== settings.journeyMinAge;

  return (
    <Card withBorder radius="lg" padding="lg">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!valid) return;
          setBusy(true);
          try {
            await onSave(age);
          } finally {
            setBusy(false);
          }
        }}
      >
        <Stack gap="sm">
          <div>
            <Title order={2} size="h3">
              {t('admin.worlds.title')}
            </Title>
            <Text size="sm" c="dimmed">
              {t('admin.worlds.hint')}
            </Text>
          </div>
          <NumberInput
            label={t('admin.worlds.minAge')}
            description={t('admin.worlds.minAgeHint')}
            value={age}
            onChange={(v) => setAge(typeof v === 'number' ? v : '')}
            min={0}
            max={99}
            allowDecimal={false}
            allowNegative={false}
            suffix={` ${t('admin.worlds.years')}`}
            maw={260}
            size="md"
            disabled={!settings}
            error={age !== '' && !valid ? t('admin.worlds.invalid') : undefined}
          />
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
    </Card>
  );
}
