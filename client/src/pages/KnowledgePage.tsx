import { Badge, Button, Card, Center, Group, Loader, Stack, Text, Title } from '@mantine/core';
import { IconLock, IconPlayerPlay } from '@tabler/icons-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { CURRICULUM, isLessonUnlocked, theoryFor, type ExplainStep } from '@klavio/shared';
import { useSession } from '../auth/session';
import { TheoryPicture } from '../lesson/theory/TheoryPicture';
import { useLocalized } from '../lesson/useLocalized';
import { useProgress } from '../lesson/useProgress';
import { worldOf } from '../lesson/worlds';

/**
 * "Wissen": everything the learner has discovered so far, to look up again –
 * the explanation cards of every lesson that is unlocked. Lessons further
 * ahead stay hidden until they are reached.
 */
export function KnowledgePage() {
  const { t } = useTranslation();
  const loc = useLocalized();
  const { activeProfile } = useSession();
  const { completed, progress } = useProgress();
  const kids = activeProfile?.uiMode !== 'classic';

  if (!progress) {
    return (
      <Center py="xl">
        <Loader aria-label={t('common.loading')} />
      </Center>
    );
  }

  return (
    <Stack gap="xl" maw={900} mx="auto">
      <div>
        <Title order={1}>{t('knowledge.title')}</Title>
        <Text c="dimmed" fz="lg">
          {t('knowledge.intro')}
        </Text>
      </div>
      {CURRICULUM.map((chapter, ci) => {
        const lessons = chapter.lessons.filter((l) =>
          theoryFor(l.id).some((s) => s.type === 'explain'),
        );
        if (!lessons.length) return null;
        const world = worldOf(chapter.id, ci);
        return (
          <section key={chapter.id} aria-labelledby={`knowledge-${chapter.id}`}>
            <Group gap="xs" mb="sm">
              <Badge variant="light" size="lg">
                {t('path.chapter', { n: ci + 1 })} · {t(`path.worlds.${world.id}`)}
              </Badge>
            </Group>
            <Title order={2} size="h3" mb="md" id={`knowledge-${chapter.id}`}>
              {loc(chapter.title)}
            </Title>
            <Stack gap="md">
              {lessons.map((lesson) => {
                const open = isLessonUnlocked(lesson.id, completed);
                if (!open) {
                  return (
                    <Card
                      key={lesson.id}
                      withBorder
                      radius="lg"
                      padding="md"
                      bg="var(--klavio-locked-bg)"
                    >
                      <Group gap="sm" wrap="nowrap">
                        <IconLock aria-hidden />
                        <Text fw={700}>
                          {loc(lesson.title)} – {t('knowledge.locked')}
                        </Text>
                      </Group>
                    </Card>
                  );
                }
                const cards = theoryFor(lesson.id).filter(
                  (s): s is ExplainStep => s.type === 'explain',
                );
                return (
                  <Card
                    key={lesson.id}
                    withBorder
                    radius="lg"
                    padding="lg"
                    data-testid={`knowledge-${lesson.id}`}
                  >
                    <Group justify="space-between" mb="sm" wrap="wrap">
                      <Title order={3} size="h4">
                        {loc(lesson.title)}
                      </Title>
                      <Button
                        component={Link}
                        to={`/lesson/${lesson.id}`}
                        variant="light"
                        size="md"
                        leftSection={<IconPlayerPlay size={18} />}
                      >
                        {t('knowledge.toLesson')}
                      </Button>
                    </Group>
                    <Stack gap="lg">
                      {cards.map((c, i) => (
                        <Stack key={i} gap="sm">
                          <Text fz={kids ? 'lg' : 'md'}>{loc(c.text)}</Text>
                          {c.picture && <TheoryPicture picture={c.picture} kids={false} />}
                        </Stack>
                      ))}
                    </Stack>
                  </Card>
                );
              })}
            </Stack>
          </section>
        );
      })}
    </Stack>
  );
}
