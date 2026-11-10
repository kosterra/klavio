import { Card, SegmentedControl, Stack, Text, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useSession } from '../auth/session';
import { usePlayOn, type PlayOn } from '../lesson/playOn';
import { useErrorText } from '../auth/useErrorText';
import { notify } from './notify';

/**
 * «Wo spielst du?»: on the real piano or on the screen keys – what the lesson
 * start and free play offer first. Kept with the profile.
 */
export function PlayOnSetting() {
  const { t } = useTranslation();
  const { activeProfile } = useSession();
  const errorText = useErrorText();
  const [value, setPlayOn] = usePlayOn();
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
            setPlayOn(v as PlayOn).then(
              () => notify(t('profileSettings.saved')),
              (err: unknown) => notify(errorText(err), 'red'),
            );
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
