import { Anchor, Card, Stack, Text, Title } from '@mantine/core';
import { IconBrandGithub, IconSparkles } from '@tabler/icons-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { APP_CONFIG } from '@klavio/shared';

export function AboutCard() {
  const { t } = useTranslation();
  return (
    <Card withBorder radius="lg" padding="lg">
      <Stack gap="xs">
        <Title order={2} size="h3">
          {t('about.title', { appName: APP_CONFIG.name })}
        </Title>
        <Text size="sm">{t('about.text')}</Text>
        <Anchor
          component={Link}
          to="/whats-new"
          size="sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 32 }}
        >
          <IconSparkles size={18} aria-hidden />
          {t('whatsNew.link')} · {t('whatsNew.version', { version: __APP_VERSION__ })}
        </Anchor>
        <Anchor
          href={APP_CONFIG.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          size="sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 32 }}
        >
          <IconBrandGithub size={18} aria-hidden />
          {t('about.source')}
        </Anchor>
      </Stack>
    </Card>
  );
}
