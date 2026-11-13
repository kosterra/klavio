import { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Group,
  Modal,
  Stack,
  Switch,
  Text,
  ThemeIcon,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { IconLock, IconTrash, IconVolume } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { MyProgress } from '../family/MyProgress';
import { BadgeShelf } from '../lesson/Badges';
import { Wardrobe } from '../components/Wardrobe';
import { PlacementCard } from '../components/PlacementCard';
import { ProfilePinCard } from '../auth/ChildDevices';
import { usePageTitle } from '../components/usePageTitle';
import type { GoalSong } from '@klavio/shared';
import { endpoints, type ProfileInput } from '../api/endpoints';
import { useSession } from '../auth/session';
import { useErrorText } from '../auth/useErrorText';
import { ParentPinForm } from '../auth/parent';
import { useParentUnlocked } from '../auth/useParentUnlocked';
import { Buddy } from '../components/Buddy';
import { ProfileForm } from '../components/ProfileForm';
import { notify } from '../components/notify';
import { NoteRain } from '../landing/Effects';
import { tapCounter, useKonami } from '../landing/easterEggs';
import { FIGURE_TUNES } from '../landing/figureTunes';
import { playMelody } from '../audio/synth';
import landing from '../landing/Landing.module.css';
import classes from './ProfileSettingsPage.module.css';
import { GoalSongEditor } from '../goal/GoalSongEditor';
import { WeeklyGoalSetting } from '../components/WeeklyGoalSetting';
import { PlayOnSetting } from '../components/PlayOnSetting';
import { ReminderSetting } from '../components/ReminderSetting';
import { useAutoRead, useCanSpeak } from '../components/useReadAloud';

/**
 * "Mein Profil": name, figure, display mode, daily goal. The figure is the
 * child's own choice; everything else (and deleting) is parent area.
 */
export function ProfileSettingsPage() {
  const { t } = useTranslation();
  usePageTitle(t('nav.profile'));
  // easter eggs
  const [rain, setRain] = useState(0);
  const [spin, setSpin] = useState(false);
  const [disco, setDisco] = useState(false);
  const [secret, setSecret] = useState('');
  const [taps] = useState(() => tapCounter(5));
  const announce = (message: string) => {
    setSecret(message);
    setTimeout(() => setSecret(''), 4500);
  };
  useKonami(() => {
    setDisco(true);
    setRain((r) => r + 1);
    announce(t('profileSettings.eggDisco'));
    setTimeout(() => setDisco(false), 6000);
  });
  const { activeProfile, refresh } = useSession();
  const navigate = useNavigate();
  const errorText = useErrorText();
  const parentUnlocked = useParentUnlocked();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  // remount the form after unlocking / saving so it shows the stored values
  const [formKey, setFormKey] = useState(0);
  if (!activeProfile) return null;

  const save = async (values: ProfileInput) => {
    // send only what changed – a child (parent area locked) may change just the figure
    const changes = Object.fromEntries(
      Object.entries(values).filter(
        ([k, v]) =>
          activeProfile[k as keyof ProfileInput] !== v && (parentUnlocked || k === 'avatar'),
      ),
    ) as Partial<ProfileInput>;
    if (Object.keys(changes).length === 0) return;
    setBusy(true);
    setError(null);
    try {
      await endpoints.updateProfile(activeProfile.id, changes);
      await refresh();
      setFormKey((k) => k + 1);
      notify(t('profileSettings.saved'));
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const saveGoal = async (goalSong: GoalSong | null) => {
    setBusy(true);
    setError(null);
    try {
      await endpoints.updateProfile(activeProfile.id, { goalSong });
      await refresh();
      notify(t(goalSong ? 'goal.saved' : 'goal.removed'));
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await endpoints.deleteProfile(activeProfile.id);
      await refresh();
      navigate('/profiles', { replace: true });
    } catch (err) {
      setError(errorText(err));
      setConfirmDelete(false);
    } finally {
      setBusy(false);
    }
  };

  const onFigureTap = () => {
    if (!activeProfile || !taps()) return;
    const tune = FIGURE_TUNES[activeProfile.avatar];
    playMelody(
      tune.map((midi) => ({ midi, beats: 0.5 })),
      150,
    );
    setSpin(true);
    setRain((r) => r + 1);
    announce(t('profileSettings.eggTune', { name: t(`avatars.names.${activeProfile.avatar}`) }));
  };

  return (
    <Stack gap="lg" maw={760} mx="auto">
      <NoteRain run={rain} />
      <div role="status" aria-live="polite" className={landing.secret}>
        {secret}
      </div>
      <Group wrap="nowrap">
        {/* secret: tap your figure five times – or type the Konami code */}
        <UnstyledButton
          onClick={onFigureTap}
          aria-label={t('profileSettings.figureButton', {
            name: t(`avatars.names.${activeProfile.avatar}`),
          })}
          className={`${classes.figureButton} ${spin ? classes.spin : ''} ${disco ? classes.disco : ''}`}
          onAnimationEnd={() => setSpin(false)}
        >
          <Buddy mood={spin || disco ? 'cheer' : 'happy'} size={72} />
        </UnstyledButton>
        <Title order={1}>{t('profileSettings.title')}</Title>
      </Group>

      {!parentUnlocked && (
        <Alert color="blue" variant="light" icon={<IconLock />}>
          <Group justify="space-between" gap="sm">
            <Text size="sm">{t('profileSettings.figureOnly')}</Text>
            <Button size="sm" variant="light" onClick={() => setUnlocking(true)}>
              {t('profileSettings.openParent')}
            </Button>
          </Group>
        </Alert>
      )}
      {error && (
        <Alert color="red" role="alert">
          {error}
        </Alert>
      )}

      <Card withBorder radius="lg" padding="lg">
        <ProfileForm
          key={`${formKey}-${parentUnlocked}`}
          initial={activeProfile}
          submitLabel={t('common.save')}
          busy={busy}
          figureOnly={!parentUnlocked}
          onSubmit={(v) => void save(v)}
        />
      </Card>

      <MyProgress />

      <BadgeShelf earned={activeProfile.badges} />

      <WeeklyGoalSetting />

      <PlayOnSetting />

      <ReminderSetting />

      <Wardrobe />

      <ReadAloudSetting />

      <GoalSongEditor
        key={activeProfile.goalSong?.title ?? 'none'}
        initial={activeProfile.goalSong}
        busy={busy}
        onSave={(g) => void saveGoal(g)}
      />

      {parentUnlocked && <PlacementCard />}

      {parentUnlocked && <ProfilePinCard />}

      {parentUnlocked && (
        <Card
          withBorder
          radius="lg"
          padding="lg"
          style={{ borderColor: 'var(--mantine-color-red-4)' }}
        >
          <Stack gap="sm">
            <Text size="sm">{t('profileSettings.deleteHint', { name: activeProfile.name })}</Text>
            <Group>
              <Button
                color="var(--klavio-danger)"
                variant="outline"
                leftSection={<IconTrash size={18} />}
                onClick={() => setConfirmDelete(true)}
              >
                {t('profileSettings.delete')}
              </Button>
            </Group>
          </Stack>
        </Card>
      )}

      <Modal
        closeButtonProps={{ 'aria-label': t('common.close') }}
        opened={unlocking}
        onClose={() => setUnlocking(false)}
        title={t('parent.title')}
        radius="lg"
      >
        <ParentPinForm onUnlocked={() => setUnlocking(false)} />
      </Modal>

      <Modal
        closeButtonProps={{ 'aria-label': t('common.close') }}
        opened={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={t('profileSettings.deleteConfirm', { name: activeProfile.name })}
        radius="lg"
      >
        <Stack>
          <Text>{t('profileSettings.deleteHint', { name: activeProfile.name })}</Text>
          <Group grow>
            <Button variant="default" onClick={() => setConfirmDelete(false)}>
              {t('common.cancel')}
            </Button>
            <Button color="red.9" loading={busy} onClick={() => void remove()}>
              {t('common.delete')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}

/** «Klavi liest vor»: read tasks and explanations aloud (per profile, on this device). */
function ReadAloudSetting() {
  const { t } = useTranslation();
  const [on, setOn] = useAutoRead();
  const can = useCanSpeak();
  return (
    <Card withBorder radius="lg" padding="lg">
      <Group justify="space-between" wrap="nowrap" align="flex-start">
        <Group gap="sm" wrap="nowrap" align="flex-start">
          <ThemeIcon size={44} radius="xl" variant="light" color="indigo" aria-hidden>
            <IconVolume size={24} />
          </ThemeIcon>
          <div>
            <Text fw={700} id="read-aloud-label">
              {t('speech.auto')}
            </Text>
            <Text size="sm" c="dimmed">
              {can ? t('speech.autoHint') : t('speech.noVoice')}
            </Text>
          </div>
        </Group>
        <Switch
          checked={on && can}
          disabled={!can}
          onChange={(e) => setOn(e.currentTarget.checked)}
          aria-labelledby="read-aloud-label"
        />
      </Group>
    </Card>
  );
}
