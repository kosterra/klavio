import { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Center,
  Container,
  Group,
  Modal,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { MAX_PROFILES_PER_ACCOUNT } from '@klavio/shared';
import { endpoints, type ProfileInput } from '../api/endpoints';
import { useSession } from '../auth/session';
import { useErrorText } from '../auth/useErrorText';
import { Mascot } from '../components/Mascot';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { ProfileForm } from '../components/ProfileForm';
import classes from './ProfilesPage.module.css';

/** "Who's playing today?" — shown after login and when switching profiles. */
export function ProfilesPage() {
  const { t } = useTranslation();
  const { profiles, selectProfile, refresh } = useSession();
  const navigate = useNavigate();
  const errorText = useErrorText();
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const choose = async (id: string) => {
    setError(null);
    try {
      await selectProfile(id);
      navigate('/');
    } catch (err) {
      setError(errorText(err));
    }
  };

  const create = async (values: ProfileInput) => {
    setBusy(true);
    setError(null);
    try {
      const p = await endpoints.createProfile(values);
      await refresh();
      setCreating(false);
      await choose(p.id);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container size="md" py="xl">
      <Stack align="center" gap="lg">
        <Mascot mood={profiles.length ? 'happy' : 'think'} size={96} />
        <Title order={1} ta="center">
          {t('profiles.title')}
        </Title>
        {profiles.length === 0 && (
          <Text ta="center" c="dimmed" maw={460}>
            {t('profiles.empty')}
          </Text>
        )}
        {error && (
          <Alert color="red" role="alert">
            {error}
          </Alert>
        )}
        <Group justify="center" gap="lg" w="100%">
          {profiles.map((p) => (
            <UnstyledButton key={p.id} onClick={() => choose(p.id)} className={classes.tile}>
              <Card withBorder radius="xl" padding="lg" h="100%">
                <Stack align="center" gap="xs">
                  <ProfileAvatar avatar={p.avatar} size={96} />
                  <Text fw={800} fz="xl" ta="center">
                    {p.name}
                  </Text>
                </Stack>
              </Card>
            </UnstyledButton>
          ))}
          {profiles.length < MAX_PROFILES_PER_ACCOUNT && (
            <UnstyledButton onClick={() => setCreating(true)} className={classes.tile}>
              <Card withBorder radius="xl" padding="lg" h="100%" className={classes.add}>
                <Center h="100%">
                  <Stack align="center" gap="xs">
                    <IconPlus size={48} aria-hidden />
                    <Text fw={700}>{t('profiles.add')}</Text>
                  </Stack>
                </Center>
              </Card>
            </UnstyledButton>
          )}
        </Group>
        {profiles.length >= MAX_PROFILES_PER_ACCOUNT && (
          <Text c="dimmed">{t('profiles.limit')}</Text>
        )}
        <Button variant="subtle" onClick={() => navigate('/account')}>
          {t('nav.account')}
        </Button>
      </Stack>

      <Modal
        closeButtonProps={{ 'aria-label': t('common.close') }}
        opened={creating}
        onClose={() => setCreating(false)}
        title={t('profiles.createTitle')}
        size="lg"
        radius="lg"
      >
        <ProfileForm
          submitLabel={t('profiles.create')}
          busy={busy}
          onSubmit={create}
          onCancel={() => setCreating(false)}
        />
      </Modal>
    </Container>
  );
}
