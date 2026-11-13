import { ActionIcon, Card, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import {
  IconFeather,
  IconMountain,
  IconNotes,
  IconPlayerPlay,
  IconPrinter,
} from '@tabler/icons-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { CLASSICS, FOLK_SONGS, type ClassicPiece } from '@klavio/shared';
import { useLocalized } from '../lesson/useLocalized';
import { PreviewButton } from '../components/PreviewButton';

/** «Klassik zum Üben»: pieces of the great composers, simplified, to practise and print. */
export function Classics() {
  return (
    <Shelf name="classics" pieces={CLASSICS} icon={<IconFeather size={24} />} color="indigo.7" />
  );
}

/** «Schweizer Volkslieder»: old Swiss songs from a print of 1826, to practise and print. */
export function FolkSongs() {
  return <Shelf name="folk" pieces={FOLK_SONGS} icon={<IconMountain size={24} />} color="teal.8" />;
}

function Shelf({
  name,
  pieces,
  icon,
  color,
}: {
  name: 'classics' | 'folk';
  pieces: ClassicPiece[];
  icon: React.ReactNode;
  color: string;
}) {
  const { t } = useTranslation();
  const loc = useLocalized();
  if (!pieces.length) return null;
  return (
    <section aria-labelledby={`${name}-title`} data-testid={name}>
      <Title order={2} size="h4" mb={4} id={`${name}-title`}>
        {t(`${name}.title`)}
      </Title>
      <Text size="sm" c="dimmed" mb="xs">
        {t(`${name}.intro`)}
      </Text>
      <Stack gap="xs">
        {pieces.map((c) => (
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
                <ThemeIcon size={44} radius="xl" color={color} aria-hidden>
                  {icon}
                </ThemeIcon>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text fw={800} lh={1.25}>
                    {loc(c.title)}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {loc(c.composer)}
                  </Text>
                </div>
                <IconPlayerPlay size={22} aria-hidden />
              </Group>
            </Card>
            <PreviewButton exercise={c.exercise} title={loc(c.title)} testId={`preview-${c.id}`} />
            <ActionIcon
              component={Link}
              to={`/classics/${c.id}/notes`}
              variant="default"
              radius="lg"
              size="auto"
              w={52}
              aria-label={t('notes.openLabel', { title: loc(c.title) })}
            >
              <IconNotes size={22} />
            </ActionIcon>
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
