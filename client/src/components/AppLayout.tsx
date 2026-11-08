import {
  ActionIcon,
  AppShell,
  Badge,
  Group,
  Menu,
  Text,
  UnstyledButton,
  useMantineColorScheme,
} from '@mantine/core';
import {
  IconCheck,
  IconCloudOff,
  IconDeviceDesktop,
  IconMoon,
  IconSun,
  IconLogout,
  IconPiano,
  IconSettings,
  IconShield,
  IconUserCircle,
  IconBulb,
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
  const { me, activeProfile, logout, offline } = useSession();
  const { colorScheme, setColorScheme } = useMantineColorScheme();
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
            {offline && (
              <Badge
                color="orange.9"
                variant="light"
                size="lg"
                leftSection={<IconCloudOff size={14} />}
                role="status"
                data-testid="offline-badge"
              >
                {t('offline.badge')}
              </Badge>
            )}
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
                    leftSection={<IconUserCircle size={18} />}
                    onClick={() => navigate('/profile')}
                  >
                    {t('nav.profile')}
                  </Menu.Item>
                )}
                {activeProfile && (
                  <Menu.Item
                    leftSection={<IconBulb size={18} />}
                    onClick={() => navigate('/knowledge')}
                  >
                    {t('nav.knowledge')}
                  </Menu.Item>
                )}
                {activeProfile && (
                  <Menu.Item
                    leftSection={<IconPiano size={18} />}
                    onClick={() => navigate('/input')}
                  >
                    {t('nav.input')}
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
                <Menu.Label>{t('nav.colorScheme')}</Menu.Label>
                {(['auto', 'light', 'dark'] as const).map((scheme) => (
                  <Menu.Item
                    key={scheme}
                    closeMenuOnClick={false}
                    leftSection={
                      scheme === 'auto' ? (
                        <IconDeviceDesktop size={18} />
                      ) : scheme === 'light' ? (
                        <IconSun size={18} />
                      ) : (
                        <IconMoon size={18} />
                      )
                    }
                    rightSection={colorScheme === scheme ? <IconCheck size={16} /> : null}
                    aria-checked={colorScheme === scheme}
                    role="menuitemradio"
                    onClick={() => setColorScheme(scheme)}
                  >
                    {t(`nav.scheme.${scheme}`)}
                  </Menu.Item>
                ))}
                <Menu.Divider />
                <Menu.Item
                  color="var(--klavio-danger)"
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
