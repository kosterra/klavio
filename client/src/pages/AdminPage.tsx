import { useEffect, useState } from 'react';
import { Alert, Card, Stack, Switch, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { AdminSettingsDto } from '@klavio/shared';
import { endpoints } from '../api/endpoints';
import { useSession } from '../auth/session';
import { useErrorText } from '../auth/useErrorText';

/** Global switches for admins (role granted via `npm run admin:grant`). */
export function AdminPage() {
  const { t } = useTranslation();
  const { refresh } = useSession();
  const errorText = useErrorText();
  const [settings, setSettings] = useState<AdminSettingsDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    endpoints.adminSettings().then(setSettings, (e) => setError(errorText(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = async (registrationOpen: boolean) => {
    setError(null);
    try {
      setSettings(await endpoints.updateAdminSettings({ registrationOpen }));
      await refresh();
    } catch (err) {
      setError(errorText(err));
    }
  };

  return (
    <Stack gap="lg" maw={760} mx="auto">
      <Title order={1}>{t('admin.title')}</Title>
      {error && <Alert color="red">{error}</Alert>}
      <Card withBorder radius="lg" padding="lg">
        <Switch
          label={t('admin.registrationOpen')}
          description={t('admin.registrationOpenHint')}
          checked={settings?.registrationOpen ?? false}
          disabled={!settings}
          onChange={(e) => void toggle(e.currentTarget.checked)}
        />
      </Card>
    </Stack>
  );
}
