import { ActionIcon, Card, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconFeather, IconPlayerPlay, IconPrinter } from '@tabler/icons-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { CLASSICS } from '@klavio/shared';
import { useLocalized } from '../lesson/useLocalized';

/** «Klassik zum Üben»: pieces of the great composers, simplified, to practise and print. */
export function Classics() {
  const { t } = useTranslation();
  const loc = useLocalized();
  return (
    <section aria-labelledby="classics-title" data-testid="classics">
      <Title order={2} size="h4" mb={4} id="classics-title">
        {t('classics.title')}
      </Title>
      <Text size="sm" c="dimmed" mb="xs">
        {t('classics.intro')}
      </Text>
      <Stack gap="xs">
        {CLASSICS.map((c) => (
          <Group key={c.id} gap="xs" wrap="nowrap" align="stretch">
            <Card
              component={Link}
              to={`/classics/${c.id}`}
              withBorder
              radius="lg"
              padding="sm"
              style={{ flex: 1, minWidth: 0 }}
              data-testid={`classic-${c.id}`}
            >
              <Group wrap="nowrap" gap="sm">
                <ThemeIcon size={44} radius="xl" color="indigo.7" aria-hidden>
                  <IconFeather size={24} />
                </ThemeIcon>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text fw={800} lh={1.25}>
                    {loc(c.title)}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {c.composer}
                  </Text>
                </div>
                <IconPlayerPlay size={22} aria-hidden />
              </Group>
            </Card>
            <ActionIcon
              component={Link}
              to={`/classics/${c.id}/print`}
              variant="default"
              radius="lg"
              size="auto"
              w={52}
              aria-label={t('sheet.printSong', { title: loc(c.title) })}
            >
              <IconPrinter size={22} />
            </ActionIcon>
          </Group>
        ))}
      </Stack>
    </section>
  );
}
