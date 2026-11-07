import { useState } from 'react';
import { Alert, Button, Card, Center, Group, Stack, Text, TextInput, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { recoveryCodeSchema } from '@klavio/shared';
import { endpoints } from '../api/endpoints';
import { useSession } from '../auth/session';
import { useErrorText } from '../auth/useErrorText';

export function RecoveryLoginPage() {
  const { t } = useTranslation();
  const { refresh, setAfterLogin } = useSession();
  const errorText = useErrorText();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: { code: '' },
    validate: {
      code: (v) => (recoveryCodeSchema.safeParse(v).success ? null : t('validation.recovery')),
    },
  });

  const onSubmit = form.onSubmit(async ({ code }) => {
    setBusy(true);
    setError(null);
    try {
      await endpoints.recoveryLogin(code);
      // straight to the account page so a new passkey can be added
      setAfterLogin({ to: '/account', notice: t('recoveryLogin.afterLogin') });
      await refresh();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  });

  return (
    <Center mih="100dvh" p="md">
      <Card withBorder shadow="sm" padding="xl" radius="xl" maw={480} w="100%">
        <form onSubmit={onSubmit} noValidate>
          <Stack gap="md">
            <Title order={1} size="h2">
              {t('recoveryLogin.title')}
            </Title>
            <Text c="dimmed">{t('recoveryLogin.hint')}</Text>
            {error && (
              <Alert color="red" role="alert">
                {error}
              </Alert>
            )}
            <TextInput
              label={t('recoveryLogin.code')}
              autoComplete="one-time-code"
              autoCapitalize="characters"
              spellCheck={false}
              ff="monospace"
              key={form.key('code')}
              {...form.getInputProps('code')}
            />
            <Group grow>
              <Button variant="default" component={Link} to="/welcome">
                {t('common.back')}
              </Button>
              <Button type="submit" loading={busy}>
                {t('recoveryLogin.submit')}
              </Button>
            </Group>
          </Stack>
        </form>
      </Card>
    </Center>
  );
}
