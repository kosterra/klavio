import { Anchor, Button, Card, Container, Group, List, Stack, Text, Title } from '@mantine/core';
import { IconArrowLeft, IconCircleCheck, IconPiano } from '@tabler/icons-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../components/usePageTitle';
import { APP_CONFIG } from '@klavio/shared';
import { useSession } from '../auth/session';
import { SiteFooter } from '../components/SiteFooter';
import classes from '../whatsNew/WhatsNew.module.css';

/** The sections in order; each has a title and paragraphs or a list in the translations. */
const SECTIONS = [
  'audio',
  'stored',
  'device',
  'sharing',
  'retention',
  'rights',
  'children',
] as const;

/** Lists are stored as numbered keys ({"1": …, "2": …}) – the translations hold strings only. */
function listOf(value: unknown): string[] {
  return value && typeof value === 'object' ? Object.values(value as Record<string, string>) : [];
}

function Section({ id }: { id: (typeof SECTIONS)[number] }) {
  const { t } = useTranslation();
  const items = listOf(t(`privacy.${id}.items`, { returnObjects: true, defaultValue: {} }));
  return (
    <section aria-labelledby={`privacy-${id}`}>
      <Title order={2} size="h3" id={`privacy-${id}`} mb="xs">
        {t(`privacy.${id}.title`)}
      </Title>
      <Text>{t(`privacy.${id}.text`)}</Text>
      {items.length > 0 && (
        <List mt="xs" spacing={6}>
          {items.map((item) => (
            <List.Item key={item}>{item}</List.Item>
          ))}
        </List>
      )}
    </section>
  );
}

/**
 * Privacy policy for everyone (visitors too), in plain words: what Klavio
 * stores, what never leaves the device, who gets what, and how to delete it.
 * The operator of the instance (set by admins) is named as responsible.
 */
export function PrivacyPage() {
  const { t } = useTranslation();
  usePageTitle(null, '/privacy');
  const { me, config } = useSession();
  const back = me ? '/' : '/welcome';
  const operator = config?.operatorName;
  const contact = config?.contactEmail;
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
            {t('privacy.title')}
          </Title>
          <Text fz="lg" mt="xs" maw={620}>
            {t('privacy.lead')}
          </Text>
        </Container>
      </header>
      <Container size="md" py="xl">
        <Stack gap="xl">
          <Card withBorder radius="lg" padding="lg">
            <Title order={2} size="h3" mb="sm">
              {t('privacy.short.title')}
            </Title>
            <List
              spacing="xs"
              icon={<IconCircleCheck size={22} color="var(--mantine-color-teal-7)" aria-hidden />}
            >
              {listOf(t('privacy.short.items', { returnObjects: true })).map((item) => (
                <List.Item key={item}>{item}</List.Item>
              ))}
            </List>
          </Card>

          <section aria-labelledby="privacy-responsible" data-testid="privacy-responsible">
            <Title order={2} size="h3" id="privacy-responsible" mb="xs">
              {t('privacy.responsible.title')}
            </Title>
            {operator || contact ? (
              <Text>
                {t('privacy.responsible.text', { name: operator || APP_CONFIG.name })}
                {contact && (
                  <>
                    {' '}
                    {t('privacy.responsible.contact')}{' '}
                    <Anchor href={`mailto:${contact}`}>{contact}</Anchor>
                  </>
                )}
              </Text>
            ) : (
              <Text>{t('privacy.responsible.unknown')}</Text>
            )}
            <Text mt="xs" size="sm" c="dimmed">
              {t('privacy.responsible.software', { app: APP_CONFIG.name })}
            </Text>
          </section>

          {SECTIONS.map((id) => (
            <Section key={id} id={id} />
          ))}

          <Text size="sm" c="dimmed">
            {t('privacy.updated', { version: __APP_VERSION__ })}
          </Text>
        </Stack>
      </Container>
      <SiteFooter />
    </div>
  );
}
