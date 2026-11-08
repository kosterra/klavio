import { NavLink as MantineNavLink, Stack, Text } from '@mantine/core';
import {
  IconBulb,
  IconChartBar,
  IconLock,
  IconMap2,
  IconMetronome,
  IconMusic,
  IconPiano,
  IconShield,
} from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useSession } from '../auth/session';
import { useParentUnlocked } from '../auth/useParentUnlocked';

/**
 * The side navigation: the places of the app in groups – learning, the parent
 * area (behind the lock) and, for admins, the administration. What belongs to
 * the person (profile, account, colours, language) is in the avatar menu.
 */
export function SideNav({ onNavigate }: { onNavigate: () => void }) {
  const { t } = useTranslation();
  const { me, activeProfile } = useSession();
  const parentUnlocked = useParentUnlocked();
  const { pathname } = useLocation();
  const lock = parentUnlocked ? null : <IconLock size={14} aria-label={t('parent.title')} />;

  const item = (to: string, label: string, icon: ReactNode, right?: ReactNode) => {
    const active = to === '/' ? pathname === '/' : pathname.startsWith(to);
    return (
      <MantineNavLink
        key={to}
        component={NavLink}
        to={to}
        end={to === '/'}
        label={label}
        leftSection={icon}
        rightSection={right}
        active={active}
        onClick={onNavigate}
        variant="light"
        styles={{
          root: { borderRadius: 'var(--mantine-radius-md)', minHeight: 44 },
          // the active place: normal text colour in bold (AA contrast on the light background)
          label: active ? { color: 'var(--mantine-color-text)', fontWeight: 800 } : undefined,
        }}
      />
    );
  };
  const heading = (text: string) => (
    <Text size="xs" fw={800} tt="uppercase" c="dimmed" px="sm" mt="md" mb={4}>
      {text}
    </Text>
  );

  return (
    <Stack gap={2} component="nav" aria-label={t('nav.main')} data-testid="side-nav">
      {activeProfile && (
        <>
          {heading(t('nav.learnGroup'))}
          {item('/', t('dashboard.learnPath'), <IconMap2 size={20} />)}
          {item('/play', t('freePlay.title'), <IconMusic size={20} />)}
          {item('/metronome', t('metronome.title'), <IconMetronome size={20} />)}
          {item('/knowledge', t('nav.knowledge'), <IconBulb size={20} />)}
        </>
      )}
      {heading(t('nav.parentGroup'))}
      {item('/family', t('family.title'), <IconChartBar size={20} />, lock)}
      {activeProfile && item('/input', t('nav.input'), <IconPiano size={20} />, lock)}
      {me?.user.role === 'admin' && (
        <>
          {heading(t('nav.adminGroup'))}
          {item('/admin', t('nav.admin'), <IconShield size={20} />)}
        </>
      )}
    </Stack>
  );
}
