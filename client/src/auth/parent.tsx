import { useState, type ReactNode } from 'react';
import {
  Alert,
  Button,
  Card,
  Center,
  Group,
  PinInput,
  Stack,
  Switch,
  Text,
  Title,
} from '@mantine/core';
import { IconArrowLeft, IconFingerprint, IconLock } from '@tabler/icons-react';
import { Navigate, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { endpoints } from '../api/endpoints';
import { useSession } from './session';
import { useErrorText } from './useErrorText';
import { useParentUnlocked } from './useParentUnlocked';
import { unlockParentWithPasskey } from './passkey';

/** PIN entry; calls `onUnlocked` after the server accepted it. */
export function ParentPinForm({ onUnlocked }: { onUnlocked?: () => void }) {
  const { t } = useTranslation();
  const { me, refresh } = useSession();
  const errorText = useErrorText();
  const withPasskey = me?.user.parentPin.passkey ?? false;
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (value = pin) => {
    if (value.length < 4) return;
    setBusy(true);
    setError(null);
    try {
      await endpoints.verifyParentPin(value);
      await refresh();
      onUnlocked?.();
    } catch (err) {
      setError(errorText(err));
      setPin('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <Stack gap="md" align="center">
        {withPasskey && (
          <>
            <Button
              size="lg"
              leftSection={<IconFingerprint />}
              loading={busy}
              onClick={async () => {
                setBusy(true);
                setError(null);
                try {
                  await unlockParentWithPasskey();
                  await refresh();
                  onUnlocked?.();
                } catch (err) {
                  setError(errorText(err));
                } finally {
                  setBusy(false);
                }
              }}
            >
              {t('parent.withPasskey')}
            </Button>
            <Text size="sm" c="dimmed">
              {t('parent.orPin')}
            </Text>
          </>
        )}
        <Text ta="center">{t('parent.enterPin')}</Text>
        <PinInput
          length={4}
          type="number"
          mask
          size="lg"
          value={pin}
          onChange={setPin}
          onComplete={(v) => void submit(v)}
          aria-label={t('parent.pin')}
          autoFocus={!withPasskey}
        />
        {error && (
          <Alert color="red" role="alert" w="100%">
            {error}
          </Alert>
        )}
        <Button type="submit" loading={busy} disabled={pin.length < 4}>
          {t('parent.open')}
        </Button>
        <PinReset onUnlocked={onUnlocked} />
      </Stack>
    </form>
  );
}

/**
 * «PIN vergessen?»: a code to the account's e-mail address removes the PIN
 * and opens the parent area – logging in again no longer does that.
 */
function PinReset({ onUnlocked }: { onUnlocked?: () => void }) {
  const { t } = useTranslation();
  const { me, refresh } = useSession();
  const errorText = useErrorText();
  const [step, setStep] = useState<'idle' | 'sent'>('idle');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await work();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  if (step === 'idle') {
    return (
      <Stack gap={4} align="center">
        <Button
          variant="subtle"
          size="compact-sm"
          loading={busy}
          onClick={() =>
            void run(async () => {
              await endpoints.requestPinReset();
              setStep('sent');
            })
          }
          data-testid="pin-forgot"
        >
          {t('parent.forgot')}
        </Button>
        {error && (
          <Text size="sm" c="red.8" role="alert">
            {error}
          </Text>
        )}
      </Stack>
    );
  }
  return (
    <Stack gap="xs" align="center" w="100%" data-testid="pin-reset">
      <Text size="sm" ta="center">
        {t('parent.resetSent', { email: me?.user.email ?? '' })}
      </Text>
      <PinInput
        length={6}
        type="number"
        oneTimeCode
        value={code}
        onChange={setCode}
        aria-label={t('parent.resetCode')}
        onComplete={(v) =>
          void run(async () => {
            await endpoints.confirmPinReset(v);
            await refresh();
            onUnlocked?.();
          })
        }
      />
      {error && (
        <Alert color="red" role="alert" w="100%">
          {error}
        </Alert>
      )}
      <Text size="xs" c="dimmed" ta="center">
        {t('parent.resetHint')}
      </Text>
    </Stack>
  );
}

/** Shows the PIN prompt instead of `children` while the parent area is locked. */
export function ParentGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { me } = useSession();
  const unlocked = useParentUnlocked();
  if (unlocked) return <>{children}</>;
  // a child's PIN session: the parent pages don't exist here
  if (me?.childLogin) return <Navigate to="/" replace />;
  // a child who got here is never stuck: back to where they were
  const back = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate('/');
  };
  return (
    <Center py="xl">
      <Card withBorder radius="xl" padding="xl" maw={440} w="100%">
        <Stack align="center" gap="md">
          <IconLock size={40} aria-hidden />
          <Title order={1} size="h2" ta="center">
            {t('parent.title')}
          </Title>
          <ParentPinForm />
          <Text size="sm" c="dimmed" ta="center">
            {t('parent.gateHint')}
          </Text>
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={18} />}
            onClick={back}
            data-testid="parent-gate-back"
          >
            {t('common.back')}
          </Button>
        </Stack>
      </Card>
    </Center>
  );
}

/** Settings block for the Konto page: set, change, remove the PIN; lock now. */
export function ParentPinSettings() {
  const { t } = useTranslation();
  const { me, refresh } = useSession();
  const navigate = useNavigate();
  const errorText = useErrorText();
  const [step, setStep] = useState<'idle' | 'enter' | 'confirm'>('idle');
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = me?.user.parentPin.set ?? false;

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

  return (
    <Card withBorder radius="lg" padding="lg">
      <Stack gap="sm">
        <Title order={2} size="h3">
          {t('parent.title')}
        </Title>
        <Text c="dimmed" size="sm">
          {set ? t('parent.isSet') : t('parent.explain')}
        </Text>
        {set && (
          <Switch
            label={t('parent.passkeySetting')}
            description={
              (me?.user.passkeyCount ?? 0) > 0
                ? t('parent.passkeySettingHint')
                : t('parent.passkeySettingNeedsPasskey')
            }
            checked={me?.user.parentPin.passkeyEnabled ?? false}
            disabled={busy || (me?.user.passkeyCount ?? 0) === 0}
            onChange={(e) => {
              const enabled = e.currentTarget.checked;
              void run(async () => {
                await endpoints.setParentPasskey(enabled);
                await refresh();
              });
            }}
          />
        )}
        {error && (
          <Alert color="red" role="alert">
            {error}
          </Alert>
        )}
        {step === 'idle' ? (
          <Group>
            <Button variant={set ? 'light' : 'filled'} onClick={() => setStep('enter')}>
              {set ? t('parent.change') : t('parent.set')}
            </Button>
            {set && (
              <>
                <Button
                  variant="light"
                  leftSection={<IconLock size={18} />}
                  loading={busy}
                  onClick={() =>
                    run(async () => {
                      await endpoints.lockParentArea();
                      await refresh();
                      navigate('/profiles');
                    })
                  }
                >
                  {t('parent.lockNow')}
                </Button>
                <Button
                  variant="subtle"
                  color="red"
                  c="var(--klavio-danger)"
                  loading={busy}
                  onClick={() =>
                    run(async () => {
                      await endpoints.removeParentPin();
                      await refresh();
                    })
                  }
                >
                  {t('parent.remove')}
                </Button>
              </>
            )}
          </Group>
        ) : (
          <Stack gap="sm" align="flex-start">
            <Text size="sm" fw={700} id="pin-step">
              {step === 'enter' ? t('parent.newPin') : t('parent.repeatPin')}
            </Text>
            <PinInput
              size="lg"
              key={step}
              length={4}
              type="number"
              mask
              value={step === 'enter' ? first : second}
              onChange={step === 'enter' ? setFirst : setSecond}
              aria-labelledby="pin-step"
              autoFocus
            />
            <Group mt="xs">
              <Button
                variant="default"
                onClick={() => {
                  setStep('idle');
                  setFirst('');
                  setSecond('');
                }}
              >
                {t('common.cancel')}
              </Button>
              {step === 'enter' ? (
                <Button disabled={first.length < 4} onClick={() => setStep('confirm')}>
                  {t('common.continue')}
                </Button>
              ) : (
                <Button
                  loading={busy}
                  disabled={second.length < 4}
                  onClick={() => {
                    if (second !== first) {
                      setError(t('parent.mismatch'));
                      setSecond('');
                      return;
                    }
                    void run(async () => {
                      await endpoints.setParentPin(first);
                      await refresh();
                      setStep('idle');
                      setFirst('');
                      setSecond('');
                    });
                  }}
                >
                  {t('common.save')}
                </Button>
              )}
            </Group>
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
