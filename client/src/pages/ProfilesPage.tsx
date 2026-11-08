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
import { IconFingerprint, IconPlus } from '@tabler/icons-react';
import { browserSupportsWebAuthn } from '@simplewebauthn/browser';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../components/usePageTitle';
import { WorldPanorama } from '../lesson/WorldPanorama';
import { CHAPTER_COLORS, chapterVars } from '../lesson/worlds';
import { MAX_PROFILES_PER_ACCOUNT } from '@klavio/shared';
import { endpoints, type ProfileInput } from '../api/endpoints';
import { useSession } from '../auth/session';
import { useErrorText } from '../auth/useErrorText';
import { Mascot } from '../components/Mascot';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { ProfileForm } from '../components/ProfileForm';
import { ParentPinForm } from '../auth/parent';
import { useParentUnlocked } from '../auth/useParentUnlocked';
import classes from './ProfilesPage.module.css';

/** "Who's playing today?" — shown after login and when switching profiles. */
export function ProfilesPage() {
  const { t } = useTranslation();
  usePageTitle(t('profiles.title'));
  const { me, profiles, selectProfile, refresh } = useSession();
  const navigate = useNavigate();
  const errorText = useErrorText();
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const parentUnlocked = useParentUnlocked();
  // Accounts start with e-mail login only; suggest a passkey until one exists.
  const showPasskeyNudge =
    !nudgeDismissed && me?.user.passkeyCount === 0 && browserSupportsWebAuthn();

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
    <Stack mih="100dvh" justify="space-between" gap={0}>
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
            {profiles.map((p, i) => (
              <UnstyledButton key={p.id} onClick={() => choose(p.id)} className={classes.tile}>
                <Card
                  withBorder
                  radius="xl"
                  padding="lg"
                  h="100%"
                  className={classes.profileCard}
                  style={chapterVars(CHAPTER_COLORS[i % CHAPTER_COLORS.length]!)}
                >
                  <Stack align="center" gap="xs">
                    <ProfileAvatar avatar={p.avatar} outfit={p.outfit} size={110} alive />
                    <Text fw={800} fz="xl" ta="center">
                      {p.name}
                    </Text>
                  </Stack>
                </Card>
              </UnstyledButton>
            ))}
            {profiles.length < MAX_PROFILES_PER_ACCOUNT && (
              <UnstyledButton
                onClick={() => (parentUnlocked ? setCreating(true) : setUnlocking(true))}
                className={classes.tile}
              >
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
          {showPasskeyNudge && (
            <Alert
              color="blue"
              variant="light"
              icon={<IconFingerprint />}
              maw={560}
              withCloseButton
              closeButtonLabel={t('common.close')}
              onClose={() => setNudgeDismissed(true)}
            >
              <Stack gap="xs" align="flex-start">
                <Text size="sm">{t('profiles.passkeyNudge')}</Text>
                <Button size="sm" onClick={() => navigate('/account')}>
                  {t('profiles.passkeyNudgeButton')}
                </Button>
              </Stack>
            </Alert>
          )}
          <Button variant="subtle" onClick={() => navigate('/account')}>
            {t('nav.account')}
          </Button>
        </Stack>

        <Modal
          closeButtonProps={{ 'aria-label': t('common.close') }}
          opened={unlocking}
          onClose={() => setUnlocking(false)}
          title={t('parent.title')}
          radius="lg"
        >
          <ParentPinForm
            onUnlocked={() => {
              setUnlocking(false);
              setCreating(true);
            }}
          />
        </Modal>

        <Modal
          closeButtonProps={{ 'aria-label': t('common.close') }}
          opened={creating}
          onClose={() => setCreating(false)}
          title={t('profiles.createTitle')}
          size="xl"
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
      <WorldPanorama />
    </Stack>
  );
}
