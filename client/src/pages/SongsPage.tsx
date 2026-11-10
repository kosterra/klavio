import { Card, Center, Group, Loader, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconLock, IconMusic, IconPlayerPlay } from '@tabler/icons-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { CURRICULUM, isLessonUnlocked } from '@klavio/shared';
import { usePageTitle } from '../components/usePageTitle';
import { useLocalized } from '../lesson/useLocalized';
import { useProgress } from '../lesson/useProgress';
import classes from './SongsPage.module.css';
import { useLessonFor } from '../lesson/useLessonFor';

/**
 * «Lieder»: every song of the course in one place. Songs that are open can be
 * played again at any time; the others show the chapter they come with.
 */
export function SongsPage() {
  const { t } = useTranslation();
  usePageTitle(t('songs.title'));
  const loc = useLocalized();
  const forMe = useLessonFor();
  const { progress, completed } = useProgress();

  if (!progress) {
    return (
      <Center py="xl">
        <Loader aria-label={t('common.loading')} />
      </Center>
    );
  }

  const chapters = CURRICULUM.map((chapter, ci) => ({
    chapter,
    n: ci + 1,
    songs: chapter.lessons.filter((l) => l.kind === 'song'),
  })).filter((c) => c.songs.length > 0);
  const open = chapters.flatMap((c) => c.songs).filter((l) => isLessonUnlocked(l.id, completed));

  return (
    <Stack gap="lg" maw={900} mx="auto" data-testid="songs">
      <div>
        <Title order={1}>{t('songs.title')}</Title>
        <Text c="dimmed" fz="lg">
          {t('songs.intro', { count: open.length })}
        </Text>
      </div>
      {chapters.map(({ chapter, n, songs }) => (
        <section key={chapter.id} aria-labelledby={`songs-${chapter.id}`}>
          <Title order={2} size="h4" mb="xs" id={`songs-${chapter.id}`}>
            {t('path.chapter', { n })} · {loc(chapter.title)}
          </Title>
          <Stack gap="xs">
            {songs.map((lesson) => {
              const unlocked = isLessonUnlocked(lesson.id, completed);
              const stars = progress.lessons[lesson.id]?.bestStars ?? 0;
              const body = (
                <Group wrap="nowrap" gap="sm">
                  <ThemeIcon
                    size={44}
                    radius="xl"
                    color={unlocked ? 'pink.7' : 'gray.7'}
                    aria-hidden
                  >
                    {unlocked ? <IconMusic size={24} /> : <IconLock size={22} />}
                  </ThemeIcon>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text fw={800} lh={1.25}>
                      {loc(forMe(lesson).title)}
                    </Text>
                    <Text size="sm" c="dimmed">
                      {!unlocked
                        ? t('songs.locked', { n })
                        : stars > 0
                          ? t('path.stars', { count: stars })
                          : t('songs.new')}
                    </Text>
                  </div>
                  {unlocked && (
                    <span className={classes.play} aria-hidden>
                      <IconPlayerPlay size={22} />
                    </span>
                  )}
                </Group>
              );
              return unlocked ? (
                <Card
                  key={lesson.id}
                  component={Link}
                  to={`/lesson/${lesson.id}`}
                  withBorder
                  radius="lg"
                  padding="sm"
                  className={classes.song}
                  data-testid={`song-${lesson.id}`}
                >
                  {body}
                </Card>
              ) : (
                <Card
                  key={lesson.id}
                  withBorder
                  radius="lg"
                  padding="sm"
                  className={classes.locked}
                  data-testid={`song-${lesson.id}`}
                >
                  {body}
                </Card>
              );
            })}
          </Stack>
        </section>
      ))}
    </Stack>
  );
}
