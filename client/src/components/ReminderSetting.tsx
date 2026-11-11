import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Chip,
  Group,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconBell } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { ReminderDto } from '@klavio/shared';
import { endpoints } from '../api/endpoints';
import { useSession } from '../auth/session';
import { useErrorText } from '../auth/useErrorText';
import { notify } from './notify';

const DAYS = [1, 2, 3, 4, 5, 6, 7];

function keyBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const b64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/** The service worker, if there is one (none in development, none in some browsers). */
async function registration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
  const reg = await Promise.race([
    navigator.serviceWorker.ready,
    new Promise<null>((r) => setTimeout(() => r(null), 3000)),
  ]);
  return reg ?? null;
}

/**
 * «Erinnerung»: this device reminds the active profile to practise at a time
 * on chosen days – a notification, only if it has not played yet that day.
 * Needs the instance's push key and a browser that can (on iPhone/iPad: the
 * app installed on the home screen).
 */
export function ReminderSetting() {
  const { t, i18n } = useTranslation();
  const errorText = useErrorText();
  const { config, activeProfile, offline } = useSession();
  const key = config?.pushPublicKey ?? null;
  const [supported, setSupported] = useState<boolean | null>(null);
  const [current, setCurrent] = useState<ReminderDto | null>(null);
  const [time, setTime] = useState('17:00');
  const [days, setDays] = useState<string[]>(DAYS.map(String));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    void (async () => {
      const reg = await registration();
      if (cancelled) return;
      setSupported(!!reg);
      const sub = await reg?.pushManager.getSubscription();
      if (!sub || cancelled) return;
      const status = await endpoints.reminderStatus(sub.endpoint).catch(() => null);
      if (cancelled || !status) return;
      setCurrent(status);
      setTime(status.time);
      setDays(status.days.map(String));
    })();
    return () => {
      cancelled = true;
    };
  }, [key]);

  if (!key || !activeProfile) return null;
  const forOther = current && current.profileId !== activeProfile.id;
  const dayName = (d: number) =>
    new Intl.DateTimeFormat(i18n.language, { weekday: 'short' }).format(
      new Date(Date.UTC(2026, 10, 1 + d, 12)), // 2 Nov 2026 is a Monday
    );

  const save = async () => {
    setBusy(true);
    try {
      const reg = await registration();
      if (!reg) throw new Error('unsupported');
      if ((await Notification.requestPermission()) !== 'granted') {
        notify(t('reminder.denied'), 'blue');
        return;
      }
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: keyBytes(key),
        }));
      const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
      const saved = await endpoints.setReminder({
        subscription: { endpoint: json.endpoint, keys: json.keys },
        time,
        days: days.map(Number),
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      setCurrent(saved);
      notify(t('reminder.saved', { time }));
    } catch (err) {
      notify(
        err instanceof Error && err.message === 'unsupported'
          ? t('reminder.unsupported')
          : errorText(err),
        'red',
      );
    } finally {
      setBusy(false);
    }
  };

  const off = async () => {
    setBusy(true);
    try {
      const reg = await registration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await endpoints.reminderOff(sub.endpoint);
        await sub.unsubscribe();
      }
      setCurrent(null);
      notify(t('reminder.off'));
    } catch (err) {
      notify(errorText(err), 'red');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card withBorder radius="lg" padding="lg" data-testid="reminder">
      <Stack gap="sm">
        <Group gap="xs">
          <IconBell size={22} aria-hidden />
          <Title order={2} size="h3">
            {t('reminder.title')}
          </Title>
        </Group>
        <Text size="sm">{t('reminder.hint')}</Text>
        {supported === false ? (
          <Alert color="blue" variant="light" data-testid="reminder-unsupported">
            {t('reminder.unsupported')}
          </Alert>
        ) : (
          <>
            <Switch
              size="md"
              checked={!!current && !forOther}
              disabled={busy || offline}
              label={t('reminder.switch', { name: activeProfile.name })}
              onChange={(e) => void (e.currentTarget.checked ? save() : off())}
              data-testid="reminder-switch"
            />
            {forOther && (
              <Text size="sm" c="dimmed">
                {t('reminder.forOther')}
              </Text>
            )}
            <Group gap="md" align="flex-end" wrap="wrap">
              <TextInput
                type="time"
                label={t('reminder.time')}
                value={time}
                onChange={(e) => setTime(e.currentTarget.value)}
                w={150}
                size="md"
              />
              <Chip.Group multiple value={days} onChange={setDays}>
                <Group gap={6} wrap="wrap" aria-label={t('reminder.days')} role="group">
                  {DAYS.map((d) => (
                    <Chip key={d} value={String(d)} size="sm">
                      {dayName(d)}
                    </Chip>
                  ))}
                </Group>
              </Chip.Group>
            </Group>
            {current && !forOther && (
              <Button
                variant="light"
                onClick={() => void save()}
                loading={busy}
                disabled={!days.length}
                w="fit-content"
              >
                {t('reminder.update')}
              </Button>
            )}
          </>
        )}
      </Stack>
    </Card>
  );
}
