import { useState } from 'react';
import {
  Alert,
  Button,
  PinInput,
  SimpleGrid,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { DeviceProfilesResponse } from '@klavio/shared';
import { endpoints } from '../api/endpoints';
import { ApiError } from '../api/client';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { useSession } from './session';
import classes from './ChildLogin.module.css';

/**
 * «Wer spielt?» on a child's device: the children tap their figure and type
 * their own PIN – no e-mail, no passkey, no parent needed.
 */
export function ChildLogin({ device }: { device: DeviceProfilesResponse }) {
  const { t } = useTranslation();
  const { refresh } = useSession();
  const [chosen, setChosen] = useState<DeviceProfilesResponse['profiles'][number] | null>(null);
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (value: string) => {
    if (!chosen || value.length < 4) return;
    setBusy(true);
    setError(null);
    try {
      await endpoints.childLogin(chosen.id, value);
      await refresh(); // the route guard moves on to the start page
    } catch (err) {
      const code = err instanceof ApiError ? err.code : '';
      setError(
        code === 'PIN_WRONG'
          ? t('childLogin.wrong')
          : code === 'RATE_LIMITED' || (err instanceof ApiError && err.status === 429)
            ? t('childLogin.locked')
            : t('childLogin.failed'),
      );
      setPin('');
    } finally {
      setBusy(false);
    }
  };

  if (!chosen) {
    return (
      <Stack w="100%" gap="sm" data-testid="child-login">
        <Title order={2} size="h3" ta="center">
          {t('childLogin.who')}
        </Title>
        <SimpleGrid cols={{ base: 2, xs: 3 }} spacing="sm">
          {device.profiles.map((p) => (
            <UnstyledButton
              key={p.id}
              className={classes.tile}
              onClick={() => setChosen(p)}
              data-testid={`child-${p.name}`}
            >
              <ProfileAvatar avatar={p.avatar} outfit={p.outfit} size={72} />
              <Text fw={800} ta="center" className={classes.name}>
                {p.name}
              </Text>
            </UnstyledButton>
          ))}
        </SimpleGrid>
      </Stack>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit(pin);
      }}
      style={{ width: '100%' }}
    >
      <Stack align="center" gap="md" data-testid="child-pin">
        <ProfileAvatar avatar={chosen.avatar} outfit={chosen.outfit} size={88} />
        <Title order={2} size="h3" ta="center">
          {t('childLogin.hello', { name: chosen.name })}
        </Title>
        <Text ta="center">{t('childLogin.enterPin')}</Text>
        <PinInput
          length={4}
          type="number"
          mask
          size="xl"
          value={pin}
          onChange={setPin}
          onComplete={(v) => void submit(v)}
          aria-label={t('childLogin.pin', { name: chosen.name })}
          autoFocus
        />
        {error && (
          <Alert color="red" role="alert" w="100%">
            {error}
          </Alert>
        )}
        <Button type="submit" size="lg" fullWidth loading={busy} disabled={pin.length < 4}>
          {t('childLogin.go')}
        </Button>
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={18} />}
          onClick={() => {
            setChosen(null);
            setPin('');
            setError(null);
          }}
        >
          {t('childLogin.notMe')}
        </Button>
      </Stack>
    </form>
  );
}
