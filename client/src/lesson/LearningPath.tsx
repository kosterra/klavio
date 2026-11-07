import { Group, Stack, Text, Title } from '@mantine/core';
import {
  IconLock,
  IconMusic,
  IconPiano,
  IconPlayerPlay,
  IconStarFilled,
} from '@tabler/icons-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { CURRICULUM, isLessonUnlocked, type Lesson, type ProgressDto } from '@klavio/shared';
import { Mascot } from '../components/Mascot';
import { useLocalized } from './useLocalized';
import classes from './LearningPath.module.css';

const ROW = 128; // vertical distance between stops (px)
const SWING = [0, 0.22, 0.32, 0.22, 0, -0.22, -0.32, -0.22]; // horizontal offset (share of width)

function KindIcon({ lesson, size }: { lesson: Lesson; size: number }) {
  if (lesson.kind === 'song') return <IconMusic size={size} aria-hidden />;
  if (lesson.kind === 'play') return <IconPlayerPlay size={size} aria-hidden />;
  return <IconPiano size={size} aria-hidden />;
}

/**
 * The learning path: chapters as winding tracks of lesson stops. Completed
 * stops show their stars, the next lesson is highlighted, later ones are locked.
 */
export function LearningPath({
  progress,
  currentLessonId,
}: {
  progress: ProgressDto['lessons'];
  currentLessonId: string;
}) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const completed = new Set(Object.keys(progress).filter((id) => progress[id]!.bestStars > 0));
  let index = 0;

  return (
    <Stack gap={48}>
      {CURRICULUM.map((chapter, ci) => {
        const earned = chapter.lessons.reduce((n, l) => n + (progress[l.id]?.bestStars ?? 0), 0);
        const height = chapter.lessons.length * ROW;
        const points = chapter.lessons.map((_, i) => ({
          x: 50 + SWING[i % SWING.length]! * 100,
          y: i * ROW + 46,
        }));
        return (
          <section
            key={chapter.id}
            className={classes.chapter}
            aria-labelledby={`chapter-${chapter.id}`}
          >
            <div className={classes.chapterHeader}>
              <div>
                <Text size="xs" fw={700} c="indigo.9" tt="uppercase">
                  {t('path.chapter', { n: ci + 1 })}
                </Text>
                <Title order={3} size="h4" id={`chapter-${chapter.id}`}>
                  {loc(chapter.title)}
                </Title>
              </div>
              <Group
                gap={4}
                wrap="nowrap"
                role="img"
                aria-label={t('path.starsEarned', { earned, total: chapter.lessons.length * 3 })}
              >
                <IconStarFilled size={18} color="var(--mantine-color-yellow-7)" aria-hidden />
                <Text fw={700} aria-hidden>
                  {earned}/{chapter.lessons.length * 3}
                </Text>
              </Group>
            </div>

            <div className={classes.track} style={{ height }}>
              <svg
                className={classes.line}
                viewBox={`0 0 100 ${height}`}
                preserveAspectRatio="none"
                aria-hidden
              >
                <polyline
                  points={points.map((p) => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke="var(--mantine-color-gray-4)"
                  strokeWidth={10}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="2 18"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              <ol className={classes.list}>
                {chapter.lessons.map((lesson, i) => {
                  index++;
                  const stars = progress[lesson.id]?.bestStars ?? 0;
                  const unlocked = isLessonUnlocked(lesson.id, completed);
                  const current = lesson.id === currentLessonId;
                  const state = current
                    ? 'current'
                    : stars > 0
                      ? 'done'
                      : unlocked
                        ? 'open'
                        : 'locked';
                  const title = loc(lesson.title);
                  const label = [
                    t('path.lessonN', { n: index }),
                    title,
                    state === 'locked'
                      ? t('path.locked')
                      : stars > 0
                        ? t('path.stars', { count: stars })
                        : t('path.notStarted'),
                  ].join(', ');
                  const pos = { left: `${points[i]!.x}%`, top: i * ROW };
                  return (
                    <li key={lesson.id} className={classes.stop} style={pos}>
                      {state === 'locked' ? (
                        <span
                          className={`${classes.node} ${classes.locked}`}
                          role="img"
                          aria-label={label}
                        >
                          <IconLock size={30} aria-hidden />
                        </span>
                      ) : (
                        <Link
                          to={`/lesson/${lesson.id}`}
                          className={`${classes.node} ${classes[state]}`}
                          aria-label={label}
                          aria-current={current ? 'step' : undefined}
                          data-testid={`path-${lesson.id}`}
                        >
                          <KindIcon lesson={lesson} size={current ? 40 : 32} />
                        </Link>
                      )}
                      <div className={classes.stars} aria-hidden>
                        {stars > 0 &&
                          [1, 2, 3].map((s) => (
                            <IconStarFilled
                              key={s}
                              size={18}
                              color={
                                s <= stars
                                  ? 'var(--mantine-color-yellow-6)'
                                  : 'var(--mantine-color-gray-3)'
                              }
                            />
                          ))}
                      </div>
                      <Text className={classes.title} aria-hidden>
                        {title}
                      </Text>
                      {current && (
                        <div
                          className={classes.mascot}
                          style={{ [points[i]!.x > 50 ? 'right' : 'left']: '100%' }}
                          aria-hidden
                        >
                          <Mascot mood="happy" size={64} />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          </section>
        );
      })}
    </Stack>
  );
}
