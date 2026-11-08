import { Container, Text } from '@mantine/core';
import {
  IconBrandGithub,
  IconBug,
  IconMail,
  IconPiano,
  IconScale,
  IconShieldLock,
  IconSparkles,
} from '@tabler/icons-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { APP_CONFIG } from '@klavio/shared';
import { useSession } from '../auth/session';
import classes from './SiteFooter.module.css';

const LICENSE_URL = 'https://www.gnu.org/licenses/agpl-3.0.html';

/**
 * The footer of every page: privacy, what's new, contact, source code and
 * licence. `full` on the public pages (brand, columns), `compact` inside the
 * app (one quiet row of links).
 */
export function SiteFooter({ variant = 'full' }: { variant?: 'full' | 'compact' }) {
  const { t } = useTranslation();
  const { config } = useSession();
  const operator = config?.operatorName;
  const contact = config?.contactEmail;
  const external = { target: '_blank', rel: 'noopener noreferrer' } as const;

  const links = (
    <>
      <Link to="/privacy" className={classes.link}>
        <IconShieldLock size={18} aria-hidden /> {t('footer.privacy')}
      </Link>
      <Link to="/whats-new" className={classes.link}>
        <IconSparkles size={18} aria-hidden /> {t('whatsNew.link')}
      </Link>
      {contact && (
        <a href={`mailto:${contact}`} className={classes.link}>
          <IconMail size={18} aria-hidden /> {t('footer.contact')}
        </a>
      )}
    </>
  );
  const openSource = (
    <>
      <a href={APP_CONFIG.sourceUrl} className={classes.link} {...external}>
        <IconBrandGithub size={18} aria-hidden /> {t('about.source')}
      </a>
      <a href={`${APP_CONFIG.sourceUrl}/issues`} className={classes.link} {...external}>
        <IconBug size={18} aria-hidden /> {t('footer.issues')}
      </a>
      <a href={LICENSE_URL} className={classes.link} {...external}>
        <IconScale size={18} aria-hidden /> {t('footer.license', { license: APP_CONFIG.license })}
      </a>
    </>
  );

  if (variant === 'compact') {
    return (
      <footer className={classes.compact} data-testid="site-footer">
        <nav aria-label={t('footer.label')} className={classes.row}>
          {links}
          {openSource}
          <span className={classes.version}>
            {t('whatsNew.version', { version: __APP_VERSION__ })}
          </span>
        </nav>
      </footer>
    );
  }

  return (
    <footer className={classes.full} data-testid="site-footer">
      <Container size="lg">
        <div className={classes.grid}>
          <div className={classes.brand}>
            <span className={classes.logo}>
              <IconPiano size={24} aria-hidden />
              <Text span fw={900} fz="lg">
                {APP_CONFIG.name}
              </Text>
            </span>
            <Text size="sm" className={classes.tagline}>
              {t('footer.tagline')}
            </Text>
            {operator && (
              <Text size="sm" className={classes.tagline}>
                {t('footer.operator', { name: operator })}
              </Text>
            )}
          </div>
          <nav aria-labelledby="footer-app" className={classes.column}>
            <Text id="footer-app" className={classes.heading}>
              {APP_CONFIG.name}
            </Text>
            {links}
          </nav>
          <nav aria-labelledby="footer-open" className={classes.column}>
            <Text id="footer-open" className={classes.heading}>
              {t('footer.openSource')}
            </Text>
            {openSource}
          </nav>
        </div>
        <Text size="xs" className={classes.bottom}>
          {t('whatsNew.version', { version: __APP_VERSION__ })} · {t('footer.noTracking')}
        </Text>
      </Container>
    </footer>
  );
}
