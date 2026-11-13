import { Stack, Tabs, Text, Title } from '@mantine/core';
import {
  IconBooks,
  IconFileMusic,
  IconLock,
  IconMusic,
  IconPrinter,
  IconRoute,
} from '@tabler/icons-react';
import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  CURRICULUM,
  isLessonUnlocked,
  type PieceExercise,
  type SongExercise,
} from '@klavio/shared';
import { usePageTitle } from '../components/usePageTitle';
import { useLocalized } from '../lesson/useLocalized';
import { useProgress } from '../lesson/useProgress';
import { OwnPieces } from '../own/OwnPieces';
import { Classics, FolkSongs } from '../own/Classics';
import { PieceRow } from '../own/PieceRow';
import { PreviewButton } from '../components/PreviewButton';
import { ProgressPending } from '../components/ProgressPending';
import { useLessonFor } from '../lesson/useLessonFor';
import { useSession } from '../auth/session';
import classes from './SongsPage.module.css';

const TABS = ['path', 'own', 'collection'] as const;
type Tab = (typeof TABS)[number];

/**
 * «Lieder», in three parts: the songs of the learning path (open ones to play
 * again, the others with the chapter they come with), the family's own pieces,
 * and the collection of folk songs and classics. The part is in the address
 * (?tab=own), so it survives going back.
 */
export function SongsPage() {
  const { t } = useTranslation();
  usePageTitle(t('songs.title'));
  const { activeProfile } = useSession();
  const [params, setParams] = useSearchParams();
  const asked = params.get('tab');
  const tab: Tab = TABS.includes(asked as Tab)
    ? (asked as Tab)
    : activeProfile?.pathOff
      ? 'own'
      : 'path';

  return (
    <Stack gap="md" maw={900} mx="auto" data-testid="songs">
      <Title order={1}>{t('songs.title')}</Title>
      <Tabs
        value={tab}
        onChange={(v) => v && setParams({ tab: v }, { replace: true })}
        variant="pills"
        radius="xl"
        keepMounted={false}
      >
        <Tabs.List grow className={classes.tabs}>
          <Tabs.Tab value="path" leftSection={<IconRoute size={20} />} data-testid="songs-tab-path">
            {t('songs.tabs.path')}
          </Tabs.Tab>
          <Tabs.Tab
            value="own"
            leftSection={<IconFileMusic size={20} />}
            data-testid="songs-tab-own"
          >
            {t('songs.tabs.own')}
          </Tabs.Tab>
          <Tabs.Tab
            value="collection"
            leftSection={<IconBooks size={20} />}
            data-testid="songs-tab-collection"
          >
            {t('songs.tabs.collection')}
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="path" pt="md">
          <PathSongs />
        </Tabs.Panel>
        <Tabs.Panel value="own" pt="md">
          <OwnPieces heading={false} />
        </Tabs.Panel>
        <Tabs.Panel value="collection" pt="md">
          <Stack gap="lg">
            <Text c="dimmed">{t('songs.collectionIntro')}</Text>
            <FolkSongs />
            <Classics />
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}

/** The songs of the learning path, chapter by chapter. */
function PathSongs() {
  const { t } = useTranslation();
  const loc = useLocalized();
  const forMe = useLessonFor();
  const { progress, completed, error, reload } = useProgress();
  if (!progress) return <ProgressPending error={error} onRetry={() => void reload()} />;

  const chapters = CURRICULUM.map((chapter, ci) => ({
    chapter,
    n: ci + 1,
    songs: chapter.lessons.filter((l) => l.kind === 'song'),
  })).filter((c) => c.songs.length > 0);
  const all = chapters.flatMap((c) => c.songs);
  const open = all.filter((l) => isLessonUnlocked(l.id, completed));

  return (
    <Stack gap="lg">
      <Text c="dimmed" fz="lg">
        {open.length
          ? t('songs.intro', { count: open.length, total: all.length })
          : t('songs.introNone', { n: chapters[0]?.n ?? 1 })}
      </Text>
      {chapters.map(({ chapter, n, songs }) => (
        <section key={chapter.id} aria-labelledby={`songs-${chapter.id}`}>
          <Title order={2} size="h4" mb="xs" id={`songs-${chapter.id}`}>
            {t('path.chapter', { n })} · {loc(chapter.title)}
          </Title>
          <Stack gap="xs">
            {songs.map((lesson) => {
              const unlocked = isLessonUnlocked(lesson.id, completed);
              const stars = progress.lessons[lesson.id]?.bestStars ?? 0;
              const mine = forMe(lesson);
              const title = loc(mine.title);
              const exercise = mine.exercises.find(
                (e): e is SongExercise | PieceExercise => e.type === 'song' || e.type === 'piece',
              );
              return (
                <PieceRow
                  key={lesson.id}
                  to={unlocked ? `/lesson/${lesson.id}` : undefined}
                  locked={!unlocked}
                  testId={`song-${lesson.id}`}
                  icon={unlocked ? <IconMusic size={24} /> : <IconLock size={22} />}
                  color={unlocked ? 'pink.7' : 'gray.7'}
                  title={title}
                  meta={
                    !unlocked
                      ? t('songs.locked', { n })
                      : stars > 0
                        ? t('path.stars', { count: stars })
                        : t('songs.new')
                  }
                  listen={
                    unlocked && exercise ? (
                      <PreviewButton exercise={exercise} title={title} />
                    ) : undefined
                  }
                  actions={
                    unlocked
                      ? [
                          {
                            // the notes on paper, for the piano at home or the teacher
                            label: t('sheet.printSong', { title }),
                            icon: <IconPrinter size={22} />,
                            to: `/songs/${lesson.id}/print`,
                          },
                        ]
                      : []
                  }
                />
              );
            })}
          </Stack>
        </section>
      ))}
    </Stack>
  );
}
