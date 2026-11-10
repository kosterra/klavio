import { useState } from 'react';
import { Card, SegmentedControl, Stack, Text, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useSession } from '../auth/session';
import { readPlayOn, writePlayOn, type PlayOn } from '../lesson/playOn';
import { notify } from './notify';

/**
 * «Wo spielst du?»: on the real piano or on the screen keys – what the lesson
 * start offers first. Kept on this device, for this profile.
 */
export function PlayOnSetting() {
  const { t } = useTranslation();
  const { activeProfile } = useSession();
  const [value, setValue] = useState<PlayOn>(() => readPlayOn(activeProfile?.id));
  if (!activeProfile) return null;

  return (
    <Card withBorder radius="lg" padding="lg" data-testid="play-on">
      <Stack gap="sm">
        <div>
          <Title order={2} size="h3" id="play-on-title">
            {t('playOn.title')}
          </Title>
          <Text size="sm" c="dimmed">
            {t('playOn.hint')}
          </Text>
        </div>
        <SegmentedControl
          aria-labelledby="play-on-title"
          size="lg"
          value={value}
          onChange={(v) => {
            setValue(v as PlayOn);
            writePlayOn(v as PlayOn, activeProfile.id);
            notify(t('profileSettings.saved'));
          }}
          data={[
            { value: 'piano', label: t('playOn.piano') },
            { value: 'screen', label: t('playOn.screen') },
          ]}
        />
      </Stack>
    </Card>
  );
}
