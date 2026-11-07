import { Box, Group, Stack, Text } from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import {
  IconFileMusic,
  IconHandFinger,
  IconLock,
  IconMetronome,
  IconMusic,
  IconPiano,
  IconPlayerPlay,
  IconStarFilled,
  IconTrophy,
} from '@tabler/icons-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  CURRICULUM,
  isLessonUnlocked,
  type Avatar,
  type Lesson,
  type ProgressDto,
} from '@klavio/shared';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { useLocalized } from './useLocalized';
import classes from './LearningPath.module.css';

/** One colour per chapter (Mantine palette names), repeating. */
const CHAPTER_COLORS = ['indigo', 'teal', 'grape', 'orange', 'cyan'];

const NODE = 68;
const NODE_CURRENT = 82;

function KindIcon({ lesson, size }: { lesson: Lesson; size: number }) {
  const props = { size, 'aria-hidden': true } as const;
  if (lesson.kind === 'song') return <IconMusic {...props} />;
  if (lesson.kind === 'play') return <IconPlayerPlay {...props} />;
  if (lesson.kind === 'read') return <IconFileMusic {...props} />;
  if (lesson.kind === 'rhythm') return <IconMetronome {...props} />;
  return <IconPiano {...props} />;
}

interface Point {
  x: number;
  y: number;
  row: number;
}

/**
 * Board-game layout: stops in rows across the full width, alternating
 * left→right and right→left ("snake"), joined by a road with U-turns.
 */
function layout(count: number, width: number, cols: number, top: number, rowHeight: number) {
  const cell = width / cols;
  return Array.from({ length: count }, (_, i): Point => {
    const row = Math.floor(i / cols);
    const c = i % cols;
    const col = row % 2 === 0 ? c : cols - 1 - c;
    return { x: (col + 0.5) * cell, y: top + row * rowHeight, row };
  });
}

/** Big, faint emblem per chapter for the empty spots of its last row. */
const EMBLEMS = [IconPiano, IconHandFinger, IconFileMusic, IconMusic, IconMetronome];

function roadPath(points: Point[], cell: number): string {
  if (!points.length) return '';
  let d = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let i = 1; i < points.length; i++) {
    const p = points[i - 1]!;
    const q = points[i]!;
    if (p.row === q.row) {
      d += ` L ${q.x} ${q.y}`;
    } else {
      // U-turn at the end of a row, bulging outwards
      const dir = p.row % 2 === 0 ? 1 : -1;
      const b = dir * cell * 0.42;
      d += ` C ${p.x + b} ${p.y}, ${q.x + b} ${q.y}, ${q.x} ${q.y}`;
    }
  }
  return d;
}

/**
 * The learning path: each chapter is a coloured stretch of road with its
 * lessons as stops and a trophy at the end. The profile's own figure stands
 * on the next lesson.
 */
export function LearningPath({
  progress,
  currentLessonId,
  avatar,
}: {
  progress: ProgressDto['lessons'];
  currentLessonId: string;
  avatar: Avatar;
}) {
  const { t, i18n } = useTranslation();
  const loc = useLocalized();
  const { ref, width } = useElementSize();
  const completed = new Set(Object.keys(progress).filter((id) => progress[id]!.bestStars > 0));
  const maxCols = Math.max(3, Math.min(6, Math.floor(width / 150)));
  const narrow = width / maxCols < 140;
  const rowHeight = narrow ? 172 : 156;
  let lessonNumber = 0;

  return (
    <Stack gap="lg" ref={ref}>
      {width > 0 &&
        CURRICULUM.map((chapter, ci) => {
          const color = CHAPTER_COLORS[ci % CHAPTER_COLORS.length]!;
          const vars = {
            '--chapter-color': `var(--mantine-color-${color}-7)`,
            '--chapter-dark': `var(--mantine-color-${color}-9)`,
            '--chapter-tint': `var(--mantine-color-${color}-0)`,
          } as React.CSSProperties;
          const earned = chapter.lessons.reduce((n, l) => n + (progress[l.id]?.bestStars ?? 0), 0);
          const total = chapter.lessons.length * 3;
          const done = chapter.lessons.filter((l) => completed.has(l.id)).length;
          const goalReached = done === chapter.lessons.length;

          // lessons + the trophy at the end of the chapter; short chapters use the full width
          const count = chapter.lessons.length + 1;
          // as few rows as the width allows, filled evenly (7 stops → 4 + 3, not 6 + 1)
          const cols = Math.ceil(count / Math.ceil(count / maxCols));
          const cell = width / cols;
          const currentIndex = chapter.lessons.findIndex((l) => l.id === currentLessonId);
          // room for the walking figure above the first row only where it stands
          const top = currentIndex >= 0 && currentIndex < cols ? 108 : 58;
          const points = layout(count, width, cols, top, rowHeight);
          const rows = points[points.length - 1]!.row + 1;
          const height = top + (rows - 1) * rowHeight + (narrow ? 120 : 100);
          const emptyCells = rows * cols - count;
          const Emblem = EMBLEMS[ci % EMBLEMS.length]!;
          // the road is coloured up to the furthest completed / current stop
          const reachedIndex = goalReached
            ? points.length - 1
            : chapter.lessons.findIndex((l) => !completed.has(l.id));
          const travelled =
            reachedIndex > 0 ? roadPath(points.slice(0, reachedIndex + 1), cell) : '';
          const road = roadPath(points, cell);

          return (
            <section
              key={chapter.id}
              className={classes.chapter}
              style={vars}
              aria-labelledby={`chapter-${chapter.id}`}
            >
              <div className={classes.banner}>
                <div className={classes.bannerNumber} aria-hidden>
                  {ci + 1}
                </div>
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Text size="xs" fw={800} tt="uppercase" c="gray.7">
                    {t('path.chapter', { n: ci + 1 })}
                  </Text>
                  <Text fw={800} fz="lg" id={`chapter-${chapter.id}`} component="h3" m={0}>
                    {loc(chapter.title)}
                  </Text>
                  <div className={classes.bannerBar} aria-hidden>
                    <div
                      className={classes.bannerBarFill}
                      style={{ width: `${(done / chapter.lessons.length) * 100}%` }}
                    />
                  </div>
                </Box>
                <Group
                  gap={4}
                  wrap="nowrap"
                  role="img"
                  aria-label={t('path.starsEarned', { earned, total })}
                >
                  <IconStarFilled size={20} color="var(--mantine-color-yellow-6)" aria-hidden />
                  <Text fw={800} aria-hidden>
                    {earned}/{total}
                  </Text>
                </Group>
              </div>

              <div className={classes.board} style={{ height }}>
                <svg className={classes.road} aria-hidden>
                  <path
                    d={road}
                    fill="none"
                    stroke="var(--mantine-color-gray-2)"
                    strokeWidth={30}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {travelled && (
                    <path
                      d={travelled}
                      fill="none"
                      stroke={`var(--mantine-color-${color}-2)`}
                      strokeWidth={30}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                  <path
                    d={road}
                    fill="none"
                    stroke="#fff"
                    strokeWidth={4}
                    strokeDasharray="10 12"
                    strokeLinecap="round"
                  />
                </svg>

                {/* playful decoration in the empty spots of the last row */}
                {Array.from({ length: emptyCells }, (_, k) => {
                  const lastRow = rows - 1;
                  const c = cols - 1 - k;
                  const col = lastRow % 2 === 0 ? c : cols - 1 - c;
                  return (
                    <Emblem
                      key={k}
                      aria-hidden
                      className={classes.emblem}
                      size={Math.min(64, cell * 0.5)}
                      style={{
                        left: (col + 0.5) * cell,
                        top: top + lastRow * rowHeight,
                        color: `var(--mantine-color-${color}-2)`,
                        transform: `translate(-50%, -50%) rotate(${k % 2 ? 12 : -10}deg)`,
                      }}
                    />
                  );
                })}

                <ol className={classes.list}>
                  {chapter.lessons.map((lesson, i) => {
                    lessonNumber++;
                    const p = points[i]!;
                    const stars = progress[lesson.id]?.bestStars ?? 0;
                    const unlocked = isLessonUnlocked(lesson.id, completed);
                    const current = lesson.id === currentLessonId && !completed.has(lesson.id);
                    const state = current
                      ? 'current'
                      : stars > 0
                        ? 'done'
                        : unlocked
                          ? 'open'
                          : 'locked';
                    const title = loc(lesson.title);
                    const label = [
                      t('path.lessonN', { n: lessonNumber }),
                      title,
                      state === 'locked'
                        ? t('path.locked')
                        : stars > 0
                          ? t('path.stars', { count: stars })
                          : t('path.notStarted'),
                    ].join(', ');
                    const half = (current ? NODE_CURRENT : NODE) / 2;
                    const starRow = stars > 0 && (
                      <span className={classes.stars} aria-hidden>
                        {[1, 2, 3].map((s) => (
                          <IconStarFilled
                            key={s}
                            size={15}
                            color={
                              s <= stars
                                ? 'var(--mantine-color-yellow-6)'
                                : 'var(--mantine-color-gray-3)'
                            }
                          />
                        ))}
                      </span>
                    );
                    return (
                      <li
                        key={lesson.id}
                        className={classes.stop}
                        style={{
                          left: p.x,
                          top: p.y - half,
                          transform: 'translateX(-50%)',
                          width: cell,
                        }}
                      >
                        {state === 'locked' ? (
                          <span
                            className={`${classes.node} ${classes.locked}`}
                            role="img"
                            aria-label={label}
                          >
                            <IconLock size={26} aria-hidden />
                          </span>
                        ) : (
                          <Link
                            to={`/lesson/${lesson.id}`}
                            className={`${classes.node} ${classes[state]}`}
                            aria-label={label}
                            aria-current={current ? 'step' : undefined}
                            data-testid={`path-${lesson.id}`}
                          >
                            <KindIcon lesson={lesson} size={current ? 38 : 30} />
                            {starRow}
                          </Link>
                        )}
                        {current && (
                          <span className={classes.figure} data-testid="path-figure">
                            <ProfileAvatar avatar={avatar} size={58} />
                          </span>
                        )}
                        <Text
                          className={classes.title}
                          maw={cell - 6}
                          fz={narrow ? 12 : 'sm'}
                          lang={i18n.language}
                          aria-hidden
                        >
                          {title}
                        </Text>
                      </li>
                    );
                  })}
                  {(() => {
                    const p = points[points.length - 1]!;
                    return (
                      <li
                        className={classes.stop}
                        style={{
                          left: p.x,
                          top: p.y - NODE / 2,
                          transform: 'translateX(-50%)',
                          width: cell,
                        }}
                      >
                        <span
                          className={`${classes.node} ${goalReached ? classes.goalReached : classes.goal}`}
                          role="img"
                          aria-label={t(goalReached ? 'path.goalReached' : 'path.goal', {
                            n: ci + 1,
                          })}
                          data-testid={`path-goal-${chapter.id}`}
                        >
                          <IconTrophy size={30} aria-hidden />
                        </span>
                        <Text
                          className={classes.title}
                          maw={cell - 6}
                          fz={narrow ? 12 : 'sm'}
                          aria-hidden
                        >
                          {goalReached ? t('path.goalDone') : t('path.goalLabel')}
                        </Text>
                      </li>
                    );
                  })()}
                </ol>
              </div>
            </section>
          );
        })}
    </Stack>
  );
}
