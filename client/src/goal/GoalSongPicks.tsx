import { SimpleGrid, Text, UnstyledButton } from '@mantine/core';
import {
  IconFeather,
  IconHeart,
  IconMicrophone2,
  IconMovie,
  IconMusic,
  type Icon,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { BASE_SKILLS, SONG_CATALOG, type CatalogSong, type GoalStyle } from '@klavio/shared';
import classes from './Goal.module.css';

/** Well-known pieces many beginners dream of – titles only, from the catalogue. */
const PICKS = ['Für Elise', 'Ode to Joy', 'Canon in D', 'Minuet in G', 'Let It Be', 'Hallelujah'];

const PICK_SONGS: CatalogSong[] = PICKS.map((title) =>
  SONG_CATALOG.find((s) => s.title === title)!,
).filter(Boolean);

const STYLE_ICON: Record<GoalStyle, Icon> = {
  ballad: IconHeart,
  pop: IconMicrophone2,
  classical: IconFeather,
  film: IconMovie,
  melody: IconMusic,
};

/**
 * A few dream songs to pick with one tap, each with the number of skills it
 * needs on the way. Another title can always be typed in «Mein Profil».
 */
export function GoalSongPicks({
  value,
  onPick,
}: {
  value: string | null;
  onPick: (song: CatalogSong) => void;
}) {
  const { t } = useTranslation();
  return (
    <SimpleGrid cols={{ base: 1, xs: 2, md: 3 }} spacing="sm" data-testid="goal-picks">
      {PICK_SONGS.map((song) => {
        const Icon = STYLE_ICON[song.style];
        const skills = new Set([...BASE_SKILLS, ...song.skills]).size;
        const selected = value === song.title;
        return (
          <UnstyledButton
            key={song.title}
            className={classes.pick}
            data-selected={selected || undefined}
            aria-pressed={selected}
            onClick={() => onPick(song)}
          >
            <span className={classes.pickIcon} aria-hidden>
              <Icon size={26} />
            </span>
            <span>
              <Text fw={800} lh={1.2}>
                {song.title}
              </Text>
              {song.artist && (
                <Text size="sm" c="dimmed" lh={1.3}>
                  {song.artist}
                </Text>
              )}
              <Text size="sm" fw={700} className={classes.pickChapter}>
                {t('goal.picks.skills', { count: skills })}
              </Text>
            </span>
          </UnstyledButton>
        );
      })}
    </SimpleGrid>
  );
}
