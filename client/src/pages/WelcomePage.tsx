import { useState } from 'react';
import {
  Alert,
  Anchor,
  Button,
  Card,
  Center,
  Group,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconFingerprint, IconMail, IconUserPlus } from '@tabler/icons-react';
import { browserSupportsWebAuthn } from '@simplewebauthn/browser';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { displayNameSchema } from '@klavio/shared';
import { Mascot } from '../components/Mascot';
import { useSession } from '../auth/session';
import { loginWithPasskey, registerAccount } from '../auth/passkey';
import { useErrorText } from '../auth/useErrorText';

export function WelcomePage() {
  const { t } = useTranslation();
  const { config, refresh, setPendingRecoveryCodes } = useSession();
  const errorText = useErrorText();
  const [mode, setMode] = useState<'start' | 'register'>('start');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supported = browserSupportsWebAuthn();

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: { displayName: '' },
    validate: {
      displayName: (v) => (displayNameSchema.safeParse(v).success ? null : t('validation.name')),
    },
  });

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const onLogin = () =>
    run(async () => {
      await loginWithPasskey();
      await refresh(); // the route guard moves on to the profile picker
    });

  const onRegister = form.onSubmit(({ displayName }) =>
    run(async () => {
      const { recoveryCodes } = await registerAccount(displayName.trim());
      setPendingRecoveryCodes({ codes: recoveryCodes, next: '/profiles' });
      await refresh();
    }),
  );

  return (
    <Center mih="100dvh" p="md">
      <Card withBorder shadow="sm" padding="xl" radius="xl" maw={520} w="100%">
        <Stack align="center" gap="lg">
          <Mascot mood="happy" size={110} />
          <Title order={1} ta="center">
            {t('welcome.title')}
          </Title>
          <Text ta="center" fz="lg" c="dimmed">
            {t('welcome.subtitle')}
          </Text>

          {!supported && (
            <Alert color="orange" w="100%">
              {t('welcome.noPasskeySupport')}
            </Alert>
          )}
          {error && (
            <Alert color="red" w="100%" role="alert">
              {error}
            </Alert>
          )}

          {mode === 'start' ? (
            <Stack w="100%" gap="sm">
              <Button
                fullWidth
                size="xl"
                leftSection={<IconFingerprint />}
                onClick={onLogin}
                loading={busy}
                disabled={!supported}
              >
                {t('welcome.login')}
              </Button>
              <Text ta="center" size="sm" c="dimmed">
                {t('welcome.loginHint')}
              </Text>
              <Button
                fullWidth
                variant="light"
                leftSection={<IconUserPlus />}
                onClick={() => setMode('register')}
                disabled={!supported}
              >
                {t('welcome.register')}
              </Button>
              {config?.emailLoginEnabled && (
                <Button
                  fullWidth
                  variant="subtle"
                  leftSection={<IconMail />}
                  component={Link}
                  to="/login/email"
                >
                  {t('welcome.emailLogin')}
                </Button>
              )}
              <Anchor component={Link} to="/login/recovery" ta="center" size="sm">
                {t('welcome.recovery')}
              </Anchor>
            </Stack>
          ) : (
            <form onSubmit={onRegister} style={{ width: '100%' }} noValidate>
              <Stack gap="md">
                <Title order={2} size="h3">
                  {t('welcome.registerTitle')}
                </Title>
                <TextInput
                  label={t('welcome.displayName')}
                  description={t('welcome.displayNameHint')}
                  autoComplete="nickname"
                  maxLength={40}
                  data-autofocus
                  key={form.key('displayName')}
                  {...form.getInputProps('displayName')}
                />
                <Text size="sm" c="dimmed">
                  {t('welcome.whatIsPasskey')}
                </Text>
                <Group grow>
                  <Button variant="default" onClick={() => setMode('start')}>
                    {t('common.back')}
                  </Button>
                  <Button type="submit" loading={busy} leftSection={<IconFingerprint />}>
                    {t('welcome.createPasskey')}
                  </Button>
                </Group>
              </Stack>
            </form>
          )}
        </Stack>
      </Card>
    </Center>
  );
}
