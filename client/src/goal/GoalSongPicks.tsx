import { useState } from 'react';
import { ActionIcon, SimpleGrid, Text, UnstyledButton } from '@mantine/core';
import {
  IconFeather,
  IconFileMusic,
  IconHeart,
  IconMicrophone2,
  IconMovie,
  IconMusic,
  IconPlayerPlay,
  IconPlayerStop,
  type Icon,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import {
  BASE_SKILLS,
  SONG_CATALOG,
  dreamSnippet,
  type CatalogSong,
  type GoalStyle,
} from '@klavio/shared';
import { melodyNotes, startPreview, stopPreview, usePreview } from '../audio/preview';
import { SnippetSheet } from './SnippetSheet';
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
 * needs on the way. Pieces whose music is in the public domain can be heard
 * and seen on the staff (the opening, melody only); a song under copyright
 * stays a title. Another title can always be typed in «Mein Profil».
 */
export function GoalSongPicks({
  value,
  onPick,
}: {
  value: string | null;
  onPick: (song: CatalogSong) => void;
}) {
  const { t } = useTranslation();
  const [sheet, setSheet] = useState<CatalogSong | null>(null);
  // which pick is playing (one at a time, shared with every other «Hörprobe»)
  const [playing, setPlaying] = useState<string | null>(null);
  const preview = usePreview();
  const playingTitle = preview.playing ? playing : null;

  const listen = (song: CatalogSong) => {
    if (playingTitle === song.title) return stopPreview();
    const snippet = dreamSnippet(song.title)!;
    setPlaying(song.title);
    startPreview(preview.me, [melodyNotes(snippet.bars)], snippet.tempo);
  };

  const sheetSnippet = sheet ? dreamSnippet(sheet.title) : undefined;

  return (
    <>
      <SimpleGrid cols={{ base: 1, xs: 2, md: 3 }} spacing="sm" data-testid="goal-picks">
        {PICK_SONGS.map((song) => {
          const Icon = STYLE_ICON[song.style];
          const skills = new Set([...BASE_SKILLS, ...song.skills]).size;
          const selected = value === song.title;
          const snippet = dreamSnippet(song.title);
          const isPlaying = playingTitle === song.title;
          return (
            <div key={song.title} className={classes.pick} data-selected={selected || undefined}>
              <UnstyledButton
                className={classes.pickMain}
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
              {snippet && (
                <div className={classes.pickActions}>
                  <ActionIcon
                    variant={isPlaying ? 'filled' : 'outline'}
                    color="pink.8"
                    size={44}
                    radius="xl"
                    aria-label={t(isPlaying ? 'goal.picks.stop' : 'goal.picks.listen', {
                      title: song.title,
                    })}
                    onClick={() => listen(song)}
                  >
                    {isPlaying ? <IconPlayerStop size={22} /> : <IconPlayerPlay size={22} />}
                  </ActionIcon>
                  <ActionIcon
                    variant="outline"
                    color="pink.8"
                    size={44}
                    radius="xl"
                    aria-label={t('goal.picks.sheet', { title: song.title })}
                    onClick={() => {
                      stopPreview();
                      setSheet(song);
                    }}
                  >
                    <IconFileMusic size={22} />
                  </ActionIcon>
                </div>
              )}
            </div>
          );
        })}
      </SimpleGrid>
      {sheet && sheetSnippet && (
        <SnippetSheet song={sheet} snippet={sheetSnippet} onClose={() => setSheet(null)} />
      )}
    </>
  );
}
