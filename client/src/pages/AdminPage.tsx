import { useEffect, useState } from 'react';
import { Alert, Card, Stack, Switch, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../components/usePageTitle';
import type { AdminSettingsDto } from '@klavio/shared';
import { endpoints } from '../api/endpoints';
import { useSession } from '../auth/session';
import { useErrorText } from '../auth/useErrorText';
import { notify } from '../components/notify';
import { OperatorCard } from '../admin/OperatorCard';
import { MailTemplatesCard } from '../admin/MailTemplatesCard';
import { TestimonialsCard } from '../admin/TestimonialsCard';
import { WorldsCard } from '../admin/WorldsCard';
import { DataCard } from '../admin/DataCard';
import { SeasonPreviewCard } from '../admin/SeasonPreviewCard';

/** Settings for admins (role granted via `npm run admin:grant`). */
export function AdminPage() {
  const { t } = useTranslation();
  usePageTitle(t('admin.title'));
  const { refresh } = useSession();
  const errorText = useErrorText();
  const [settings, setSettings] = useState<AdminSettingsDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    endpoints.adminSettings().then(setSettings, (e) => setError(errorText(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = async (change: Partial<AdminSettingsDto>) => {
    setError(null);
    try {
      setSettings(await endpoints.updateAdminSettings(change));
      await refresh();
      return true;
    } catch (err) {
      setError(errorText(err));
      return false;
    }
  };

  return (
    <Stack gap="lg" maw={1100} mx="auto">
      <Title order={1}>{t('admin.title')}</Title>
      {error && <Alert color="red">{error}</Alert>}
      <Card withBorder radius="lg" padding="lg">
        <Stack gap="lg">
          <Switch
            label={t('admin.registrationOpen')}
            description={t('admin.registrationOpenHint')}
            checked={settings?.registrationOpen ?? false}
            disabled={!settings}
            onChange={(e) => void update({ registrationOpen: e.currentTarget.checked })}
          />
          <Switch
            label={t('admin.publicPage')}
            description={t('admin.publicPageHint')}
            checked={settings?.publicPage ?? false}
            disabled={!settings}
            onChange={(e) => void update({ publicPage: e.currentTarget.checked })}
          />
          <Switch
            label={t('admin.pieceLibrary')}
            description={t('admin.pieceLibraryHint')}
            checked={settings?.pieceLibrary ?? false}
            disabled={!settings}
            onChange={(e) => void update({ pieceLibrary: e.currentTarget.checked })}
            data-testid="admin-piece-library"
          />
        </Stack>
      </Card>
      <WorldsCard
        settings={settings}
        onSave={async (journeyMinAge) => {
          if (await update({ journeyMinAge })) notify(t('admin.worlds.saved'));
        }}
      />
      <DataCard
        settings={settings}
        onSave={async (change) => {
          if (await update(change)) notify(t('admin.data.saved'));
        }}
      />
      <OperatorCard
        settings={settings}
        onSave={async (info) => {
          if (await update(info)) notify(t('admin.operator.saved'));
        }}
      />
      <MailTemplatesCard />
      <TestimonialsCard />
      <SeasonPreviewCard />
    </Stack>
  );
}
