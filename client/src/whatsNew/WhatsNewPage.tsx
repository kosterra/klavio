import { Anchor, Button, Container, Group, Stack, Text, Title } from '@mantine/core';
import { IconArrowLeft, IconPiano } from '@tabler/icons-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../components/usePageTitle';
import { APP_CONFIG } from '@klavio/shared';
import { useSession } from '../auth/session';
import { SiteFooter } from '../components/SiteFooter';
import { ReleaseNotes } from './ReleaseNotes';
import classes from './WhatsNew.module.css';

/**
 * «Was ist neu» for everyone (visitors too): the versions of Klavio with their
 * changes, so one sees that it lives and grows.
 */
export function WhatsNewPage() {
  const { t } = useTranslation();
  usePageTitle(null, '/whats-new');
  const { me } = useSession();
  const back = me ? '/' : '/welcome';
  return (
    <div className={classes.page}>
      <header className={classes.hero}>
        <Container size="md">
          <Group justify="space-between">
            <Link to={back} className={classes.logo}>
              <IconPiano size={26} aria-hidden />
              <Text span fw={900} fz="lg">
                {APP_CONFIG.name}
              </Text>
            </Link>
            <Button
              component={Link}
              to={back}
              variant="white"
              size="sm"
              leftSection={<IconArrowLeft size={16} />}
            >
              {me ? t('whatsNew.backApp') : t('whatsNew.backHome')}
            </Button>
          </Group>
          <Title order={1} className={classes.title}>
            {t('whatsNew.title')}
          </Title>
          <Text fz="lg" mt="xs" maw={620}>
            {t('whatsNew.lead')}
          </Text>
          <Text size="sm" mt="sm" fw={700} data-testid="app-version">
            {t('whatsNew.thisVersion', { version: __APP_VERSION__ })}
          </Text>
        </Container>
      </header>
      <Container size="md" py="xl">
        <Stack gap="xl">
          <ReleaseNotes />
          <Stack gap={4} align="center">
            <Text size="sm" c="dimmed" ta="center">
              {t('whatsNew.open')}{' '}
              <Anchor
                href={`${APP_CONFIG.sourceUrl}/commits/main`}
                target="_blank"
                rel="noopener noreferrer"
                size="sm"
              >
                {t('whatsNew.history')}
              </Anchor>
            </Text>
          </Stack>
        </Stack>
      </Container>
      <SiteFooter />
    </div>
  );
}
