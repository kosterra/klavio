import { useState } from 'react';
import { Alert, Button, Card, Divider, Stack, Text, Title, UnstyledButton } from '@mantine/core';
import { IconFingerprint, IconMail, IconUserPlus } from '@tabler/icons-react';
import { browserSupportsWebAuthn } from '@simplewebauthn/browser';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import landing from './Landing.module.css';
import { Mascot } from '../components/Mascot';
import { SourceLink } from '../components/AboutApp';
import { useSession } from '../auth/session';
import { loginWithPasskey } from '../auth/passkey';
import { useErrorText } from '../auth/useErrorText';

/**
 * Login / sign-up card of the landing page. Accounts are created with an
 * e-mail code; passkeys are added afterwards in the account settings and then
 * offer the fastest login.
 */
export function LoginCard({ onMascotTap }: { onMascotTap?: () => void }) {
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
    <Card withBorder shadow="sm" padding="xl" radius="xl" maw={520} w="100%" id="login">
      <Stack align="center" gap="lg">
        {/* secret: tap Klavi a few times */}
        <UnstyledButton
          onClick={onMascotTap}
          aria-label={t('landing.klavi')}
          className={landing.mascotButton}
        >
          <Mascot mood="happy" size={110} />
        </UnstyledButton>
        <Title order={2} ta="center">
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
                className={landing.wrapButton}
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
            className={landing.wrapButton}
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
            className={landing.wrapButton}
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
  );
}
