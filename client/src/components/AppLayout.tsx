import { ActionIcon, AppShell, Group, Menu, Text, UnstyledButton } from '@mantine/core';
import {
  IconLogout,
  IconMicrophone,
  IconSettings,
  IconShield,
  IconUsers,
} from '@tabler/icons-react';
import { Link, Outlet, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { APP_CONFIG } from '@klavio/shared';
import { useSession } from '../auth/session';
import { ProfileAvatar } from './ProfileAvatar';
import { PrivacyBadge } from './PrivacyNote';

export function AppLayout() {
  const { t } = useTranslation();
  const { me, activeProfile, logout } = useSession();
  const navigate = useNavigate();

  return (
    <AppShell header={{ height: 72 }} padding="md">
      <AppShell.Header px="md">
        <Group h="100%" justify="space-between" wrap="nowrap">
          <UnstyledButton component={Link} to="/" aria-label={t('nav.home')}>
            <Group gap="xs" wrap="nowrap">
              <img src="/logo.svg" alt="" width={40} height={40} />
              <Text fw={800} fz="xl">
                {APP_CONFIG.name}
              </Text>
            </Group>
          </UnstyledButton>
          <Group gap="sm" wrap="nowrap">
            <PrivacyBadge />
            <Menu position="bottom-end" width={240}>
              <Menu.Target>
                <ActionIcon variant="subtle" radius="xl" size={56} aria-label={t('nav.menu')}>
                  {activeProfile ? (
                    <ProfileAvatar avatar={activeProfile.avatar} size={48} />
                  ) : (
                    <IconUsers />
                  )}
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                {activeProfile && <Menu.Label>{activeProfile.name}</Menu.Label>}
                <Menu.Item
                  leftSection={<IconUsers size={18} />}
                  onClick={() => navigate('/profiles')}
                >
                  {t('profiles.switch')}
                </Menu.Item>
                {activeProfile && (
                  <Menu.Item
                    leftSection={<IconMicrophone size={18} />}
                    onClick={() => navigate('/mic-test')}
                  >
                    {t('nav.micTest')}
                  </Menu.Item>
                )}
                <Menu.Item
                  leftSection={<IconSettings size={18} />}
                  onClick={() => navigate('/account')}
                >
                  {t('nav.account')}
                </Menu.Item>
                {me?.user.role === 'admin' && (
                  <Menu.Item
                    leftSection={<IconShield size={18} />}
                    onClick={() => navigate('/admin')}
                  >
                    {t('nav.admin')}
                  </Menu.Item>
                )}
                <Menu.Divider />
                <Menu.Item
                  color="red.9"
                  leftSection={<IconLogout size={18} />}
                  onClick={async () => {
                    await logout();
                    navigate('/welcome');
                  }}
                >
                  {t('nav.logout')}
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
