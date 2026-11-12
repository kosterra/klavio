import { useState } from 'react';
import { Card, SegmentedControl, Stack, Text, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useSession } from '../auth/session';
import { endpoints } from '../api/endpoints';
import { useErrorText } from '../auth/useErrorText';
import { notify } from './notify';

/** «Mein Wochenziel»: practice days per week – or none. The learner decides. */
export function WeeklyGoalSetting() {
  const { t } = useTranslation();
  const errorText = useErrorText();
  const { activeProfile, refresh } = useSession();
  const [busy, setBusy] = useState(false);
  if (!activeProfile) return null;
  const value = activeProfile.weeklyGoalDays ? String(activeProfile.weeklyGoalDays) : 'none';

  const change = async (v: string) => {
    setBusy(true);
    try {
      await endpoints.updateProfile(activeProfile.id, {
        weeklyGoalDays: v === 'none' ? null : Number(v),
      });
      await refresh();
      notify(t('profileSettings.saved'));
    } catch (err) {
      notify(errorText(err), 'red');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card withBorder radius="lg" padding="lg" data-testid="weekly-goal">
      <Stack gap="sm">
        <div>
          <Title order={2} size="h3" id="weekly-goal-title">
            {t('weeklyGoal.title')}
          </Title>
          <Text size="sm" c="dimmed">
            {t('weeklyGoal.hint')}
          </Text>
        </div>
        <SegmentedControl
          aria-labelledby="weekly-goal-title"
          // four choices side by side, also on the narrowest phone
          size="md"
          fullWidth
          disabled={busy}
          value={value}
          onChange={(v) => void change(v)}
          data={[
            { value: 'none', label: t('weeklyGoal.none') },
            ...[2, 4, 6].map((n) => ({
              value: String(n),
              label: t('weeklyGoal.days', { count: n }),
            })),
          ]}
        />
      </Stack>
    </Card>
  );
}
