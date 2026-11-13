import {
  IconBulb,
  IconHome,
  IconMap2,
  IconPiano,
  IconPlaylist,
  IconUserCircle,
} from '@tabler/icons-react';
import { NavLink } from 'react-router';
import { useTranslation } from 'react-i18next';
import { NavSnow } from '../season/SeasonChrome';
import { useSession } from '../auth/session';
import classes from './BottomNav.module.css';

const ITEMS = [
  { to: '/', icon: IconMap2, label: 'nav.learn', end: true },
  { to: '/play', icon: IconPiano, label: 'nav.play', end: false },
  { to: '/songs', icon: IconPlaylist, label: 'nav.songs', end: false },
  { to: '/knowledge', icon: IconBulb, label: 'nav.knowledge', end: false },
  { to: '/profile', icon: IconUserCircle, label: 'nav.profile', end: false },
] as const;

/** Phones: the main places one tap away, at the bottom where the thumb is. */
export function BottomNav() {
  const { t } = useTranslation();
  const { activeProfile } = useSession();
  // without the learning path the first place is simply «Start»
  const items = activeProfile?.pathOff
    ? ITEMS.map((i) => (i.to === '/' ? { ...i, icon: IconHome, label: 'nav.home' as const } : i))
    : ITEMS;
  return (
    <nav className={classes.nav} aria-label={t('nav.main')} data-testid="bottom-nav">
      <NavSnow place="bottom" />
      {items.map(({ to, icon: Icon, label, end }) => (
        <NavLink key={to} to={to} end={end} className={classes.item}>
          <Icon size={26} aria-hidden />
          <span>{t(label)}</span>
        </NavLink>
      ))}
    </nav>
  );
}
