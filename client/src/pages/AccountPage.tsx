import { useEffect, useState } from 'react';
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  Code,
  Group,
  Modal,
  PinInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notify } from '../components/notify';
import { AboutCard } from '../components/AboutApp';
import { ParentPinSettings } from '../auth/parent';
import {
  IconCloud,
  IconFingerprint,
  IconKey,
  IconPencil,
  IconPlus,
  IconTrash,
  IconDownload,
  IconDevicesX,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../components/usePageTitle';
import { displayNameSchema, emailSchema, type PasskeyDto } from '@klavio/shared';
import { endpoints } from '../api/endpoints';
import { useSession } from '../auth/session';
import { addPasskey } from '../auth/passkey';
import { useErrorText } from '../auth/useErrorText';

export function AccountPage() {
  const { t, i18n } = useTranslation();
  usePageTitle(t('account.title'));
  const { me, refresh, logout } = useSession();
  const navigate = useNavigate();
  const errorText = useErrorText();
  const [passkeys, setPasskeys] = useState<PasskeyDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<PasskeyDto | null>(null);
  const [newName, setNewName] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState<string | null>(null);
  const [emailCode, setEmailCode] = useState('');
  const [emailStep, setEmailStep] = useState<'show' | 'edit' | 'code'>('show');
  const [confirmDelete, deleteModal] = useDisclosure(false);

  const loadPasskeys = () => endpoints.passkeys().then(setPasskeys);
  useEffect(() => {
    void loadPasskeys();
  }, []);

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(null);
    }
  };

  if (!me) return null;
  const fmt = (iso: string) => new Date(iso).toLocaleDateString(i18n.language);

  return (
    <Stack gap="lg" maw={760} mx="auto">
      <Title order={1}>{t('account.title')}</Title>
      {error && (
        <Alert color="red" role="alert" withCloseButton onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* ---------------------------------------------------------- account name */}
      <Card withBorder radius="lg" padding="lg">
        <Stack gap="sm">
          <Title order={2} size="h3">
            {t('account.name')}
          </Title>
          <Text c="dimmed" size="sm">
            {t('account.nameHint')}
          </Text>
          {name === null ? (
            <Group justify="space-between">
              <Text fw={700} data-testid="account-name">
                {me.user.displayName}
              </Text>
              <Button
                variant="subtle"
                size="md"
                aria-label={t('account.changeName')}
                onClick={() => setName(me.user.displayName)}
              >
                {t('account.emailChange')}
              </Button>
            </Group>
          ) : (
            <Group align="flex-end">
              <TextInput
                style={{ flex: 1, minWidth: 220 }}
                label={t('account.name')}
                value={name}
                maxLength={40}
                autoComplete="nickname"
                onChange={(e) => setName(e.currentTarget.value)}
                data-autofocus
              />
              <Button variant="default" onClick={() => setName(null)}>
                {t('common.cancel')}
              </Button>
              <Button
                loading={busy === 'name'}
                disabled={!displayNameSchema.safeParse(name).success}
                onClick={() =>
                  run('name', async () => {
                    await endpoints.updateAccount(name.trim());
                    setName(null);
                    await refresh();
                  })
                }
              >
                {t('common.save')}
              </Button>
            </Group>
          )}
        </Stack>
      </Card>

      {/* ------------------------------------------------------------ passkeys */}
      <Card withBorder radius="lg" padding="lg">
        <Stack gap="sm">
          <Title order={2} size="h3">
            {t('account.passkeys')}
          </Title>
          <Text c="dimmed" size="sm">
            {t('account.passkeysHint')}
          </Text>
          {passkeys.length === 0 && (
            <Alert color="blue" variant="light" icon={<IconFingerprint />}>
              {t('account.noPasskeys')}
            </Alert>
          )}
          {passkeys.map((p) => (
            <Group key={p.id} justify="space-between" wrap="nowrap">
              <Group gap="sm" wrap="nowrap">
                <IconKey aria-hidden />
                <div>
                  <Group gap={6}>
                    <Text fw={700}>{p.name}</Text>
                    {p.backedUp && (
                      <Badge size="sm" variant="light" leftSection={<IconCloud size={12} />}>
                        {t('account.synced')}
                      </Badge>
                    )}
                  </Group>
                  <Text size="sm" c="dimmed">
                    {p.lastUsedAt
                      ? t('account.lastUsed', { date: fmt(p.lastUsedAt) })
                      : t('account.neverUsed')}
                  </Text>
                </div>
              </Group>
              <Group gap={4} wrap="nowrap">
                <ActionIcon
                  variant="subtle"
                  aria-label={`${t('account.rename')}: ${p.name}`}
                  onClick={() => {
                    setRenaming(p);
                    setNewName(p.name);
                  }}
                >
                  <IconPencil />
                </ActionIcon>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  aria-label={`${t('common.delete')}: ${p.name}`}
                  loading={busy === `del-${p.id}`}
                  onClick={() => {
                    if (!window.confirm(t('account.deleteConfirm', { name: p.name }))) return;
                    void run(`del-${p.id}`, async () => {
                      await endpoints.deletePasskey(p.id);
                      await Promise.all([loadPasskeys(), refresh()]);
                    });
                  }}
                >
                  <IconTrash />
                </ActionIcon>
              </Group>
            </Group>
          ))}
          <Button
            variant={passkeys.length === 0 ? 'filled' : 'light'}
            leftSection={<IconPlus />}
            loading={busy === 'add'}
            onClick={() =>
              run('add', async () => {
                await addPasskey();
                await Promise.all([loadPasskeys(), refresh()]);
              })
            }
          >
            {t('account.addPasskey')}
          </Button>
        </Stack>
      </Card>

      {/* --------------------------------------------------------------- e-mail */}
      <Card withBorder radius="lg" padding="lg">
        <Stack gap="sm">
          <Title order={2} size="h3">
            {t('account.email')}
          </Title>
          <Text c="dimmed" size="sm">
            {t('account.emailHint')}
          </Text>
          {emailStep === 'show' ? (
            <Group justify="space-between">
              <Text fw={700}>{me.user.email ?? '—'}</Text>
              <Button
                variant="subtle"
                size="md"
                aria-label={t('account.changeEmail')}
                onClick={() => setEmailStep('edit')}
              >
                {t('account.emailChange')}
              </Button>
            </Group>
          ) : emailStep === 'edit' ? (
            <Group align="flex-end">
              <TextInput
                style={{ flex: 1, minWidth: 220 }}
                type="email"
                autoComplete="email"
                label={t('account.emailNew')}
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                data-autofocus
              />
              <Button variant="default" onClick={() => setEmailStep('show')}>
                {t('common.cancel')}
              </Button>
              <Button
                loading={busy === 'email-request'}
                disabled={!emailSchema.safeParse(email).success}
                onClick={() =>
                  run('email-request', async () => {
                    await endpoints.accountEmailRequest(email.trim().toLowerCase());
                    setEmailStep('code');
                  })
                }
              >
                {t('account.emailSendCode')}
              </Button>
            </Group>
          ) : (
            <Stack gap="xs">
              <Text size="sm">{t('email.codeSent')}</Text>
              <Group wrap="nowrap">
                <PinInput
                  size="lg"
                  length={6}
                  type="number"
                  oneTimeCode
                  aria-label={t('email.code')}
                  value={emailCode}
                  onChange={setEmailCode}
                />
                <Button
                  loading={busy === 'email-verify'}
                  disabled={emailCode.length !== 6}
                  onClick={() =>
                    run('email-verify', async () => {
                      await endpoints.accountEmailVerify(emailCode);
                      setEmailStep('show');
                      setEmailCode('');
                      setEmail('');
                      await refresh();
                      notify(t('account.emailChanged'));
                    })
                  }
                >
                  {t('account.emailVerify')}
                </Button>
              </Group>
            </Stack>
          )}
        </Stack>
      </Card>

      <ParentPinSettings />

      {/* --------------------------------------------------- other devices */}
      <Card withBorder radius="lg" padding="lg">
        <Stack gap="sm" align="flex-start">
          <Title order={2} size="h3">
            {t('account.devices')}
          </Title>
          <Text size="sm">{t('account.devicesHint')}</Text>
          <Button
            variant="light"
            size="md"
            leftSection={<IconDevicesX size={18} />}
            onClick={async () => {
              try {
                const { loggedOut } = await endpoints.logoutOtherDevices();
                notify(t('account.devicesDone', { count: loggedOut }));
              } catch (err) {
                notify(errorText(err), 'red');
              }
            }}
            data-testid="logout-others"
          >
            {t('account.devicesButton')}
          </Button>
        </Stack>
      </Card>

      {/* ------------------------------------------------------ own data */}
      <Card withBorder radius="lg" padding="lg">
        <Stack gap="sm" align="flex-start">
          <Title order={2} size="h3">
            {t('account.export')}
          </Title>
          <Text size="sm">{t('account.exportHint')}</Text>
          <Button
            component="a"
            href="/api/account/export"
            download
            variant="light"
            size="md"
            leftSection={<IconDownload size={18} />}
            data-testid="export"
          >
            {t('account.exportButton')}
          </Button>
        </Stack>
      </Card>

      <AboutCard />

      {/* ------------------------------------------------------------- danger */}
      <Card
        withBorder
        radius="lg"
        padding="lg"
        style={{ borderColor: 'var(--mantine-color-red-4)' }}
      >
        <Stack gap="sm">
          <Title order={2} size="h3" c="red">
            {t('account.danger')}
          </Title>
          <Text size="sm">{t('account.dangerHint')}</Text>
          <Text size="sm" c="dimmed">
            {t('account.userId')}: <Code>{me.user.id}</Code>
          </Text>
          <Button color="var(--klavio-danger)" variant="outline" onClick={deleteModal.open}>
            {t('account.deleteAccount')}
          </Button>
        </Stack>
      </Card>

      <Modal
        closeButtonProps={{ 'aria-label': t('common.close') }}
        opened={!!renaming}
        onClose={() => setRenaming(null)}
        title={t('account.rename')}
        radius="lg"
      >
        <Stack>
          <TextInput
            value={newName}
            maxLength={60}
            onChange={(e) => setNewName(e.currentTarget.value)}
            data-autofocus
          />
          <Button
            disabled={!newName.trim()}
            loading={busy === 'rename'}
            onClick={() =>
              run('rename', async () => {
                await endpoints.renamePasskey(renaming!.id, newName.trim());
                setRenaming(null);
                await loadPasskeys();
              })
            }
          >
            {t('common.save')}
          </Button>
        </Stack>
      </Modal>

      <Modal
        closeButtonProps={{ 'aria-label': t('common.close') }}
        opened={confirmDelete}
        onClose={deleteModal.close}
        title={t('account.deleteAccountConfirm')}
        radius="lg"
      >
        <Stack>
          <Text>{t('account.dangerHint')}</Text>
          <Group grow>
            <Button variant="default" onClick={deleteModal.close}>
              {t('common.cancel')}
            </Button>
            <Button
              color="red.9"
              loading={busy === 'delete'}
              onClick={() =>
                run('delete', async () => {
                  await endpoints.deleteAccount();
                  await logout();
                  navigate('/welcome', { replace: true });
                })
              }
            >
              {t('common.delete')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
