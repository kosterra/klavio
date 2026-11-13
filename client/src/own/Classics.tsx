import { Stack, Text, Title } from '@mantine/core';
import { IconFeather, IconMountain, IconNotes, IconPrinter } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { CLASSICS, FOLK_SONGS, type ClassicPiece } from '@klavio/shared';
import { useLocalized } from '../lesson/useLocalized';
import { PreviewButton } from '../components/PreviewButton';
import { useProgress } from '../lesson/useProgress';
import { LevelBadge } from './LevelBadge';
import { PieceRow } from './PieceRow';
import { levelFor } from './level';

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
  const { played, progress } = useProgress();
  const done = progress ? played : null;
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
        {pieces.map((c) => {
          const title = loc(c.title);
          const { level, ready } = levelFor(c.exercise, done);
          return (
            <PieceRow
              key={c.id}
              to={`/classics/${c.id}`}
              testId={`classic-${c.id}`}
              icon={icon}
              color={color}
              title={title}
              meta={`${loc(c.composer)} · ${t('own.bars', { count: c.exercise.bars.length })}`}
              badge={<LevelBadge level={level} ready={ready} />}
              listen={
                <PreviewButton exercise={c.exercise} title={title} testId={`preview-${c.id}`} />
              }
              actions={[
                {
                  label: t('notes.openLabel', { title }),
                  icon: <IconNotes size={18} />,
                  to: `/classics/${c.id}/notes`,
                },
                {
                  label: t('sheet.printSong', { title }),
                  icon: <IconPrinter size={18} />,
                  to: `/classics/${c.id}/print`,
                },
              ]}
            />
          );
        })}
      </Stack>
    </section>
  );
}
