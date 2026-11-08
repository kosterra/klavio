import { useState } from 'react';
import { Button, Card, Group, Stack, Text, TextInput, Title } from '@mantine/core';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { AdminSettingsDto, OperatorInfo } from '@klavio/shared';

/**
 * Who runs this instance and how to reach them: shown in the footer and on
 * the privacy page (a privacy policy has to name who is responsible).
 */
export function OperatorCard(props: {
  settings: AdminSettingsDto | null;
  onSave: (info: OperatorInfo) => Promise<void>;
}) {
  // the form starts again from the saved values whenever they change
  const s = props.settings;
  return <OperatorForm key={s ? `${s.operatorName}|${s.contactEmail}` : 'loading'} {...props} />;
}

function OperatorForm({
  settings,
  onSave,
}: {
  settings: AdminSettingsDto | null;
  onSave: (info: OperatorInfo) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState(settings?.operatorName ?? '');
  const [email, setEmail] = useState(settings?.contactEmail ?? '');
  const [busy, setBusy] = useState(false);

  const dirty =
    !!settings && (name.trim() !== settings.operatorName || email.trim() !== settings.contactEmail);

  return (
    <Card withBorder radius="lg" padding="lg" data-testid="operator-card">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await onSave({ operatorName: name.trim(), contactEmail: email.trim() });
          } finally {
            setBusy(false);
          }
        }}
      >
        <Stack gap="sm">
          <div>
            <Title order={2} size="h3">
              {t('admin.operator.title')}
            </Title>
            <Text size="sm" c="dimmed">
              {t('admin.operator.hint')}
            </Text>
          </div>
          <TextInput
            label={t('admin.operator.name')}
            placeholder={t('admin.operator.namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            maxLength={120}
            disabled={!settings}
            size="md"
          />
          <TextInput
            type="email"
            label={t('admin.operator.email')}
            placeholder="kontakt@example.ch"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            disabled={!settings}
            size="md"
          />
          <Group>
            <Button
              type="submit"
              size="md"
              leftSection={<IconDeviceFloppy size={18} />}
              disabled={!dirty}
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
