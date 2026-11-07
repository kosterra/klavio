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
import { IconCloud, IconKey, IconPencil, IconPlus, IconTrash } from '@tabler/icons-react';
import { useLocation, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { emailSchema, type PasskeyDto } from '@klavio/shared';
import { endpoints } from '../api/endpoints';
import { useSession } from '../auth/session';
import { addPasskey } from '../auth/passkey';
import { useErrorText } from '../auth/useErrorText';

export function AccountPage() {
  const { t, i18n } = useTranslation();
  const { me, refresh, logout, setPendingRecoveryCodes, setAfterLogin } = useSession();
  const navigate = useNavigate();
  const notice = (useLocation().state as { notice?: string } | null)?.notice;
  const errorText = useErrorText();
  const [passkeys, setPasskeys] = useState<PasskeyDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<PasskeyDto | null>(null);
  const [newName, setNewName] = useState('');
  const [email, setEmail] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [emailStep, setEmailStep] = useState<'idle' | 'code'>('idle');
  const [confirmDelete, deleteModal] = useDisclosure(false);

  const loadPasskeys = () => endpoints.passkeys().then(setPasskeys);
  useEffect(() => {
    void loadPasskeys();
    setAfterLogin(null); // the one-time post-login redirect has been consumed
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      {notice && <Alert color="blue">{notice}</Alert>}
      {error && (
        <Alert color="red" role="alert" withCloseButton onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* ------------------------------------------------------------ passkeys */}
      <Card withBorder radius="lg" padding="lg">
        <Stack gap="sm">
          <Title order={2} size="h3">
            {t('account.passkeys')}
          </Title>
          <Text c="dimmed" size="sm">
            {t('account.passkeysHint')}
          </Text>
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
                      await loadPasskeys();
                    });
                  }}
                >
                  <IconTrash />
                </ActionIcon>
              </Group>
            </Group>
          ))}
          <Button
            variant="light"
            leftSection={<IconPlus />}
            loading={busy === 'add'}
            onClick={() =>
              run('add', async () => {
                await addPasskey();
                await loadPasskeys();
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
          {me.user.email ? (
            <Group justify="space-between">
              <Text fw={700}>{me.user.email}</Text>
              <Button
                variant="subtle"
                color="red.9"
                size="md"
                loading={busy === 'email-remove'}
                onClick={() =>
                  run('email-remove', async () => {
                    await endpoints.accountEmailRemove();
                    await refresh();
                  })
                }
              >
                {t('account.emailRemove')}
              </Button>
            </Group>
          ) : emailStep === 'idle' ? (
            <Group align="flex-end" wrap="nowrap">
              <TextInput
                style={{ flex: 1 }}
                type="email"
                autoComplete="email"
                label={t('email.address')}
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
              />
              <Button
                loading={busy === 'email-add'}
                disabled={!emailSchema.safeParse(email).success}
                onClick={() =>
                  run('email-add', async () => {
                    await endpoints.accountEmailRequest(email.trim().toLowerCase());
                    setEmailStep('code');
                  })
                }
              >
                {t('account.emailAdd')}
              </Button>
            </Group>
          ) : (
            <Stack gap="xs">
              <Text size="sm">{t('email.codeSent')}</Text>
              <Group wrap="nowrap">
                <PinInput
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
                      setEmailStep('idle');
                      setEmailCode('');
                      await refresh();
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

      {/* ------------------------------------------------------- recovery codes */}
      <Card withBorder radius="lg" padding="lg">
        <Stack gap="sm">
          <Title order={2} size="h3">
            {t('account.recoveryCodes')}
          </Title>
          <Text>{t('account.recoveryRemaining', { count: me.user.recoveryCodesRemaining })}</Text>
          <Button
            variant="light"
            loading={busy === 'recovery'}
            onClick={() => {
              if (!window.confirm(t('account.recoveryRegenerateConfirm'))) return;
              void run('recovery', async () => {
                const { recoveryCodes } = await endpoints.regenerateRecoveryCodes();
                setPendingRecoveryCodes({ codes: recoveryCodes, next: '/account' });
                await refresh();
                navigate('/recovery-codes');
              });
            }}
          >
            {t('account.recoveryRegenerate')}
          </Button>
        </Stack>
      </Card>

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
          <Button color="red.9" variant="outline" onClick={deleteModal.open}>
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
              color="red"
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
