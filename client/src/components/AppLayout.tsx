import { useState } from 'react';
import { useDisclosure } from '@mantine/hooks';
import {
  ActionIcon,
  AppShell,
  Burger,
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
  IconLanguage,
  IconMoon,
  IconSun,
  IconLogout,
  IconSettings,
  IconUserCircle,
  IconUsers,
} from '@tabler/icons-react';
import { Link, Outlet, useNavigate } from 'react-router';
import { SiteFooter } from './SiteFooter';
import { SideNav } from './SideNav';
import { BottomNav } from './BottomNav';
import { HeaderGarland, LogoCap, NavBells, NavSnow, PeekingReindeer } from '../season/SeasonChrome';
import classes from './BottomNav.module.css';
import { useTranslation } from 'react-i18next';
import { APP_CONFIG } from '@klavio/shared';
import { useSession } from '../auth/session';
import { ProfileAvatar } from './ProfileAvatar';
import { PrivacyBadge } from './PrivacyNote';

/** Side navigation open or closed (wider screens), remembered on the device. */
const SIDEBAR_KEY = 'klavio-sidebar';

export function AppLayout() {
  const { t, i18n } = useTranslation();
  const { activeProfile, logout, offline } = useSession();
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const navigate = useNavigate();
  // the side navigation: an overlay on phones; beside the page on wider screens,
  // open by default only where there is room (desktop), remembered on the device
  const [mobileOpen, { toggle: toggleMobile, close: closeMobile }] = useDisclosure(false);
  const [desktopOpen, setDesktopOpen] = useState(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_KEY);
      if (saved !== null) return saved === 'open';
    } catch {
      // storage blocked: decide by width
    }
    return window.matchMedia('(min-width: 75em)').matches;
  });
  const toggleDesktop = () =>
    setDesktopOpen((open) => {
      try {
        localStorage.setItem(SIDEBAR_KEY, open ? 'closed' : 'open');
      } catch {
        // not remembered
      }
      return !open;
    });

  return (
    <AppShell
      header={{ height: 72 }}
      navbar={{
        width: 260,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpen, desktop: !desktopOpen },
      }}
      padding="md"
    >
      <AppShell.Header px="md">
        <HeaderGarland />
        <Group h="100%" justify="space-between" wrap="nowrap">
          <Group gap="xs" wrap="nowrap">
            <Burger
              opened={mobileOpen}
              onClick={toggleMobile}
              hiddenFrom="sm"
              size="md"
              aria-label={t('nav.toggle')}
              aria-expanded={mobileOpen}
            />
            <Burger
              opened={desktopOpen}
              onClick={toggleDesktop}
              visibleFrom="sm"
              size="md"
              aria-label={t('nav.toggle')}
              aria-expanded={desktopOpen}
              data-testid="nav-toggle"
            />
            <UnstyledButton component={Link} to="/" aria-label={t('nav.home')}>
              <Group gap="xs" wrap="nowrap">
                <span style={{ position: 'relative', display: 'inline-flex' }}>
                  <img src="/logo.svg" alt="" width={40} height={40} />
                  <LogoCap />
                </span>
                <Text fw={800} fz="xl" visibleFrom="xs">
                  {APP_CONFIG.name}
                </Text>
              </Group>
            </UnstyledButton>
          </Group>
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
                    <ProfileAvatar
                      avatar={activeProfile.avatar}
                      outfit={activeProfile.outfit}
                      size={48}
                    />
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
                <Menu.Item
                  leftSection={<IconSettings size={18} />}
                  onClick={() => navigate('/account')}
                >
                  {t('nav.account')}
                </Menu.Item>
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
                <Menu.Label>{t('nav.language')}</Menu.Label>
                {(
                  [
                    ['de-CH', 'Deutsch'],
                    ['en', 'English'],
                  ] as const
                ).map(([lng, name]) => (
                  <Menu.Item
                    key={lng}
                    lang={lng}
                    closeMenuOnClick={false}
                    leftSection={<IconLanguage size={18} />}
                    rightSection={i18n.language === lng ? <IconCheck size={16} /> : null}
                    aria-checked={i18n.language === lng}
                    role="menuitemradio"
                    onClick={() => void i18n.changeLanguage(lng)}
                  >
                    {name}
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
      <AppShell.Navbar p="sm">
        <NavSnow place="side" />
        <NavBells />
        <SideNav onNavigate={closeMobile} />
      </AppShell.Navbar>
      <PeekingReindeer />
      <AppShell.Main className={activeProfile ? classes.withBottomNav : undefined}>
        <Outlet />
        <SiteFooter variant="compact" />
      </AppShell.Main>
      {activeProfile && <BottomNav />}
    </AppShell>
  );
}
