import { Anchor, Card, Stack, Text, Title } from '@mantine/core';
import { IconBrandGithub } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { APP_CONFIG } from '@klavio/shared';

/** Name, licence and link to the source code (the AGPL asks hosted versions to offer it). */
export function SourceLink({ size = 'sm' }: { size?: 'xs' | 'sm' }) {
  const { t } = useTranslation();
  return (
    <Text size={size} c="dimmed" ta="center">
      {t('about.license', { license: APP_CONFIG.license })} ·{' '}
      <Anchor
        href={APP_CONFIG.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        size={size}
        underline="always"
      >
        {t('about.source')}
      </Anchor>
    </Text>
  );
}

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
          href={APP_CONFIG.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          size="sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <IconBrandGithub size={18} aria-hidden />
          {t('about.source')}
        </Anchor>
      </Stack>
    </Card>
  );
}
