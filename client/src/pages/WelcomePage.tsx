import { useState } from 'react';
import { Alert, Button, Card, Center, Divider, Stack, Text, Title } from '@mantine/core';
import { IconFingerprint, IconMail, IconUserPlus } from '@tabler/icons-react';
import { browserSupportsWebAuthn } from '@simplewebauthn/browser';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Mascot } from '../components/Mascot';
import { SourceLink } from '../components/AboutApp';
import { useSession } from '../auth/session';
import { loginWithPasskey } from '../auth/passkey';
import { useErrorText } from '../auth/useErrorText';

/**
 * Entry screen. Accounts are created with an e-mail code; passkeys are added
 * afterwards in the account settings and then offer the fastest login.
 */
export function WelcomePage() {
  const { t } = useTranslation();
  const { config, refresh } = useSession();
  const errorText = useErrorText();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passkeysSupported = browserSupportsWebAuthn();
  const registrationOpen = config?.registrationOpen ?? true;

  const onPasskeyLogin = async () => {
    setBusy(true);
    setError(null);
    try {
      await loginWithPasskey();
      await refresh(); // the route guard moves on to the profile picker
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

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

          {error && (
            <Alert color="red" w="100%" role="alert">
              {error}
            </Alert>
          )}

          <Stack w="100%" gap="sm">
            {passkeysSupported && (
              <>
                <Button
                  fullWidth
                  size="xl"
                  leftSection={<IconFingerprint />}
                  onClick={onPasskeyLogin}
                  loading={busy}
                >
                  {t('welcome.passkeyLogin')}
                </Button>
                <Text ta="center" size="sm" c="dimmed">
                  {t('welcome.passkeyHint')}
                </Text>
              </>
            )}
            <Button
              fullWidth
              size={passkeysSupported ? 'lg' : 'xl'}
              variant={passkeysSupported ? 'light' : 'filled'}
              leftSection={<IconMail />}
              component={Link}
              to="/login/email"
            >
              {t('welcome.emailLogin')}
            </Button>
          </Stack>

          <Divider w="100%" label={t('welcome.newHere')} labelPosition="center" />

          {registrationOpen ? (
            <Button
              fullWidth
              variant="default"
              size="lg"
              leftSection={<IconUserPlus />}
              component={Link}
              to="/register"
            >
              {t('welcome.register')}
            </Button>
          ) : (
            <Text ta="center" size="sm" c="dimmed">
              {t('welcome.registrationClosed')}
            </Text>
          )}
          <SourceLink size="xs" />
        </Stack>
      </Card>
    </Center>
  );
}
