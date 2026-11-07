import { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Center,
  Group,
  PinInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { displayNameSchema, emailSchema } from '@klavio/shared';
import { endpoints } from '../api/endpoints';
import { useSession } from '../auth/session';
import { useErrorText } from '../auth/useErrorText';

type Step = 'email' | 'code' | 'name';

export function EmailLoginPage() {
  const { t } = useTranslation();
  const { refresh, setPendingRecoveryCodes } = useSession();
  const errorText = useErrorText();
  const [step, setStep] = useState<Step>('email');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    mode: 'controlled',
    initialValues: { email: '', code: '', displayName: '' },
    validate: {
      email: (v) => (emailSchema.safeParse(v).success ? null : t('validation.email')),
      code: (v) => (step !== 'email' && !/^\d{6}$/.test(v) ? t('validation.code') : null),
      displayName: (v) =>
        step === 'name' && !displayNameSchema.safeParse(v).success ? t('validation.name') : null,
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

  const onSubmit = form.onSubmit((v) =>
    run(async () => {
      const email = v.email.trim().toLowerCase();
      if (step === 'email') {
        await endpoints.emailRequest(email);
        setStep('code');
        return;
      }
      const res = await endpoints.emailVerify({
        email,
        code: v.code,
        displayName: step === 'name' ? v.displayName.trim() : undefined,
      });
      if (res.status === 'needs-display-name') {
        setStep('name');
        return;
      }
      if (res.status === 'created') {
        setPendingRecoveryCodes({ codes: res.recoveryCodes, next: '/profiles' });
      }
      await refresh();
    }),
  );

  return (
    <Center mih="100dvh" p="md">
      <Card withBorder shadow="sm" padding="xl" radius="xl" maw={480} w="100%">
        <form onSubmit={onSubmit} noValidate>
          <Stack gap="md">
            <Title order={1} size="h2">
              {t('email.title')}
            </Title>
            {error && (
              <Alert color="red" role="alert">
                {error}
              </Alert>
            )}
            <TextInput
              label={t('email.address')}
              type="email"
              autoComplete="email"
              inputMode="email"
              disabled={step !== 'email'}
              {...form.getInputProps('email')}
            />
            {step !== 'email' && (
              <>
                <Text size="sm" c="dimmed">
                  {t('email.codeSent')}
                </Text>
                <Stack gap={4}>
                  <Text component="label" fw={500} id="code-label">
                    {t('email.code')}
                  </Text>
                  <PinInput
                    length={6}
                    type="number"
                    oneTimeCode
                    aria-labelledby="code-label"
                    disabled={step === 'name'}
                    {...form.getInputProps('code')}
                  />
                  {form.errors.code && (
                    <Text c="red" size="sm">
                      {form.errors.code}
                    </Text>
                  )}
                </Stack>
              </>
            )}
            {step === 'name' && (
              <TextInput
                label={t('email.needsName')}
                autoComplete="nickname"
                maxLength={40}
                {...form.getInputProps('displayName')}
              />
            )}
            <Group grow>
              <Button variant="default" component={Link} to="/welcome">
                {t('common.back')}
              </Button>
              <Button type="submit" loading={busy}>
                {step === 'email'
                  ? t('email.sendCode')
                  : step === 'name'
                    ? t('email.createAccount')
                    : t('email.verify')}
              </Button>
            </Group>
          </Stack>
        </form>
      </Card>
    </Center>
  );
}
