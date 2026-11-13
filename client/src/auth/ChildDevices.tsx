import { useEffect, useState } from 'react';
import { Alert, Button, Card, Group, PinInput, Stack, Text, TextInput, Title } from '@mantine/core';
import { IconDeviceTablet, IconKey, IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { DeviceDto } from '@klavio/shared';
import { endpoints } from '../api/endpoints';
import { notify } from '../components/notify';
import { useSession } from './session';
import { useErrorText } from './useErrorText';
import { forgetChildDevice } from './childDevice';

/**
 * «Anmelden mit PIN» (parent area, in a learner's settings): the learner's
 * own 4-digit PIN for a child's device – set, change, remove.
 */
export function ProfilePinCard() {
  const { t } = useTranslation();
  const { activeProfile, refresh } = useSession();
  const errorText = useErrorText();
  const [step, setStep] = useState<'idle' | 'enter' | 'confirm'>('idle');
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!activeProfile) return null;
  const name = activeProfile.name;

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

  const save = (pin: string) =>
    run(async () => {
      if (pin !== first) {
        setError(t('childPin.mismatch'));
        setSecond('');
        return;
      }
      await endpoints.setProfilePin(activeProfile.id, pin);
      await refresh();
      setStep('idle');
      setFirst('');
      setSecond('');
      notify(t('childPin.saved', { name }));
    });

  return (
    <Card withBorder radius="lg" padding="lg" data-testid="child-pin-settings">
      <Stack gap="sm">
        <Title order={2} size="h3">
          {t('childPin.title')}
        </Title>
        <Text size="sm">
          {activeProfile.hasPin ? t('childPin.isSet', { name }) : t('childPin.intro', { name })}
        </Text>
        {step === 'idle' && (
          <Group gap="sm">
            <Button
              leftSection={<IconKey size={18} />}
              onClick={() => setStep('enter')}
              data-testid="child-pin-set"
            >
              {activeProfile.hasPin ? t('childPin.change') : t('childPin.set')}
            </Button>
            {activeProfile.hasPin && (
              <Button
                variant="default"
                loading={busy}
                onClick={() =>
                  void run(async () => {
                    await endpoints.removeProfilePin(activeProfile.id);
                    await refresh();
                  })
                }
              >
                {t('childPin.remove')}
              </Button>
            )}
          </Group>
        )}
        {step !== 'idle' && (
          <Stack gap="xs" align="flex-start">
            <Text size="sm" fw={700}>
              {step === 'enter' ? t('childPin.enter') : t('childPin.confirm')}
            </Text>
            <PinInput
              key={step}
              length={4}
              type="number"
              mask
              size="lg"
              value={step === 'enter' ? first : second}
              onChange={step === 'enter' ? setFirst : setSecond}
              onComplete={(v) => {
                if (step === 'enter') setStep('confirm');
                else void save(v);
              }}
              aria-label={step === 'enter' ? t('childPin.enter') : t('childPin.confirm')}
              autoFocus
            />
            <Button
              variant="subtle"
              color="gray"
              onClick={() => {
                setStep('idle');
                setFirst('');
                setSecond('');
                setError(null);
              }}
            >
              {t('common.cancel')}
            </Button>
          </Stack>
        )}
        {error && (
          <Alert color="red" role="alert">
            {error}
          </Alert>
        )}
      </Stack>
    </Card>
  );
}

/**
 * «Geräte für die Kinder» (parent area, account): this browser becomes a
 * child's device – it then shows «Wer spielt?», and the children log in with
 * their PIN. The list shows every such device, to remove one.
 */
export function ChildDevicesCard() {
  const { t, i18n } = useTranslation();
  const { profiles, logout } = useSession();
  const errorText = useErrorText();
  const [devices, setDevices] = useState<DeviceDto[] | null>(null);
  const [name, setName] = useState(() => t('devices.defaultName'));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const withPin = profiles.filter((p) => p.hasPin);

  useEffect(() => {
    endpoints.devices().then(setDevices, () => setDevices([]));
  }, []);

  const setUp = async () => {
    setBusy(true);
    setError(null);
    try {
      await endpoints.addDevice(name.trim() || t('devices.defaultName'));
      forgetChildDevice();
      // handed over: the parent logs out, the device asks «Wer spielt?»
      await logout();
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  };

  const remove = async (d: DeviceDto) => {
    try {
      await endpoints.removeDevice(d.id);
      setDevices((list) => (list ?? []).filter((x) => x.id !== d.id));
      notify(t('devices.removed', { name: d.name }));
    } catch (err) {
      notify(errorText(err), 'red');
    }
  };

  const date = (iso: string) =>
    new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(new Date(iso));
  const current = devices?.some((d) => d.current);

  return (
    <Card withBorder radius="lg" padding="lg" data-testid="child-devices">
      <Stack gap="sm">
        <Title order={2} size="h3">
          {t('devices.title')}
        </Title>
        <Text size="sm">{t('devices.intro')}</Text>
        {withPin.length === 0 ? (
          <Alert color="blue" variant="light">
            {t('devices.noPins')}
          </Alert>
        ) : (
          <Text size="sm">
            {t('devices.whoCan', { names: withPin.map((p) => p.name).join(', ') })}
          </Text>
        )}
        {devices?.map((d) => (
          <Group key={d.id} justify="space-between" wrap="nowrap" gap="sm">
            <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
              <IconDeviceTablet size={22} aria-hidden />
              <div style={{ minWidth: 0 }}>
                <Text fw={700}>
                  {d.name}
                  {d.current && ` · ${t('devices.this')}`}
                </Text>
                <Text size="sm" c="dimmed">
                  {d.lastUsedAt
                    ? t('devices.lastUsed', { date: date(d.lastUsedAt) })
                    : t('devices.since', { date: date(d.createdAt) })}
                </Text>
              </div>
            </Group>
            <Button
              variant="subtle"
              color="red"
              leftSection={<IconTrash size={16} />}
              onClick={() => void remove(d)}
              aria-label={t('devices.removeLabel', { name: d.name })}
            >
              {t('devices.remove')}
            </Button>
          </Group>
        ))}
        {!current && (
          <Stack gap="xs">
            <TextInput
              label={t('devices.name')}
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
              maxLength={60}
            />
            <Text size="sm" c="dimmed">
              {t('devices.setUpHint')}
            </Text>
            <Button
              leftSection={<IconDeviceTablet size={18} />}
              loading={busy}
              disabled={withPin.length === 0}
              onClick={() => void setUp()}
              data-testid="device-set-up"
              w="fit-content"
            >
              {t('devices.setUp')}
            </Button>
          </Stack>
        )}
        {error && (
          <Alert color="red" role="alert">
            {error}
          </Alert>
        )}
      </Stack>
    </Card>
  );
}
