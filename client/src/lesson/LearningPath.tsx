import { useEffect, useMemo, useState } from 'react';
import { Box, Group, Text, UnstyledButton } from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import {
  IconChevronDown,
  IconFileMusic,
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
import { Figure } from '../components/Figure';
import { useLocalized } from './useLocalized';
import { Sticker } from './Stickers';
import { Landmark } from './Landmarks';
import type { StickerKind } from './stickerKinds';
import { Fog, Scenery, Snowfall, WorldGate } from './WorldScenery';
import {
  CHAPTER_COLORS,
  CHRISTMAS_STICKERS,
  chapterVars,
  isChristmasSeason,
  loadRevealed,
  saveRevealed,
  worldOf,
} from './worlds';
import classes from './LearningPath.module.css';

const NODE = 72;
const NODE_CURRENT = 88;

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
/** x of a column: stones spread evenly between the same left and right margin in every chapter. */
function columnX(col: number, cols: number, width: number, margin: number): number {
  return cols > 1 ? margin + (col * (width - 2 * margin)) / (cols - 1) : margin;
}

function layout(
  count: number,
  width: number,
  cols: number,
  top: number,
  rowHeight: number,
  margin: number,
) {
  return Array.from({ length: count }, (_, i): Point => {
    const row = Math.floor(i / cols);
    const c = i % cols;
    const col = row % 2 === 0 ? c : cols - 1 - c;
    return { x: columnX(col, cols, width, margin), y: top + row * rowHeight, row };
  });
}

/**
 * Road through the stones: along each row, and at its end straight down to
 * the first stone of the next row (same column) – no diagonal stretches.
 */
function roadPath(points: Point[]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}

/**
 * Path from (x1, y1) down to (x2, y2) with round elbows: down, round turn,
 * across, round turn, down (between chapters).
 * Continues an existing path (no leading "M").
 */
function roundedStep(x1: number, y1: number, x2: number, y2: number, radius = 44): string {
  if (Math.abs(x2 - x1) < 1) return ` L ${x2} ${y2}`;
  const mid = (y1 + y2) / 2;
  const r = Math.min(radius, Math.abs(x2 - x1) / 2, (y2 - y1) / 2);
  const dir = x2 > x1 ? 1 : -1;
  // going down and turning towards x2, then turning down again
  const sweep1 = dir < 0 ? 1 : 0;
  const sweep2 = dir < 0 ? 0 : 1;
  return (
    ` L ${x1} ${mid - r}` +
    ` A ${r} ${r} 0 0 ${sweep1} ${x1 + dir * r} ${mid}` +
    ` L ${x2 - dir * r} ${mid}` +
    ` A ${r} ${r} 0 0 ${sweep2} ${x2} ${mid + r}` +
    ` L ${x2} ${y2}`
  );
}

/** Path continuing from the first point (no leading "M"). */
function continuePath(points: Point[]): string {
  return roadPath(points).replace(/^M [^ ]+ [^ ]+/, '');
}

const HEADER = 92; // height of a chapter's signpost row (phones)
const HEADER_WIDE = 124; // wider screens: room for the world's landmark
const FOOT = 36; // room at the bottom of every world for its landscape and the next gate
const FLAG_POLE_X = 12; // x of the pole inside the flag drawing

/**
 * Chapter signpost: a pole on the road with a pennant in the chapter colour
 * (gold with a tick once finished, grey with a padlock while locked).
 */
function ChapterFlag({
  number,
  state,
  waving,
  style,
}: {
  number: number;
  state: 'open' | 'done' | 'locked';
  waving: boolean;
  style: React.CSSProperties;
}) {
  const fill =
    state === 'done'
      ? 'url(#flag-gold)'
      : state === 'locked'
        ? 'var(--klavio-locked-flag)'
        : `url(#flag-${number})`;
  return (
    <svg
      className={classes.flag}
      style={style}
      width={60}
      height={76}
      viewBox="0 0 60 76"
      overflow="visible"
      aria-hidden
    >
      <defs>
        <linearGradient id={`flag-${number}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--chapter-light)" />
          <stop offset="0.75" stopColor="var(--chapter-color)" />
        </linearGradient>
        <linearGradient id="flag-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--mantine-color-yellow-4)" />
          <stop offset="0.75" stopColor="var(--mantine-color-yellow-6)" />
        </linearGradient>
      </defs>
      {/* base stone and pole */}
      <ellipse cx={FLAG_POLE_X} cy="68" rx="11" ry="5" fill="var(--klavio-locked-border)" />
      <rect
        x={FLAG_POLE_X - 2.5}
        y="4"
        width="5"
        height="65"
        rx="2.5"
        fill="var(--klavio-flag-pole)"
      />
      <circle cx={FLAG_POLE_X} cy="5" r="4.5" fill="var(--mantine-color-yellow-6)" />
      {/* pennant */}
      <g className={waving ? classes.flagWave : undefined}>
        <path
          d={`M${FLAG_POLE_X + 2} 9 Q30 3 54 12 Q46 24 54 36 Q30 29 ${FLAG_POLE_X + 2} 40 Z`}
          fill={fill}
          stroke={
            state === 'done'
              ? 'var(--mantine-color-yellow-8)'
              : state === 'locked'
                ? 'var(--klavio-locked-border)'
                : 'var(--chapter-dark)'
          }
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d={`M${FLAG_POLE_X + 6} 12 Q28 8 44 14`}
          stroke="rgb(255 255 255 / 35%)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        {state === 'done' ? (
          <path
            d="M23.5 21 l5 5 l10 -11"
            stroke="#fff"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <text
            x="31"
            y="21"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="18"
            fontWeight="800"
            fill={state === 'locked' ? 'var(--klavio-locked-fg)' : '#fff'}
            fontFamily="inherit"
          >
            {number}
          </text>
        )}
      </g>
    </svg>
  );
}

/**
 * The learning path as one continuous journey: a single road runs through all
 * chapters. Each chapter starts at a signpost (number, title, stars); the open
 * chapter winds through its lessons to a trophy, closed chapters (finished or
 * locked) are just their signpost with the road passing through. The profile's
 * own figure stands on the next lesson.
 */
export function LearningPath({
  progress,
  currentLessonId,
  avatar,
  profileId,
  title,
}: {
  progress: ProgressDto['lessons'];
  currentLessonId: string;
  avatar: Avatar;
  profileId: string;
  /** heading drawn on the first world's background, so the map fills the whole panel */
  title?: React.ReactNode;
}) {
  const { t, i18n } = useTranslation();
  const loc = useLocalized();
  const { ref, width } = useElementSize();
  const [toggled, setToggled] = useState<ReadonlySet<string>>(new Set());
  const toggle = (id: string) =>
    setToggled((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const christmas = isChristmasSeason();
  // worlds the fog has already lifted from (read once per profile, so the lift plays once)
  const revealed = useMemo(() => loadRevealed(profileId), [profileId]);
  const completed = new Set(Object.keys(progress).filter((id) => progress[id]!.bestStars > 0));
  const maxCols = Math.max(3, Math.min(6, Math.floor(width / 150)));
  const narrow = width / maxCols < 140;
  const rowHeight = narrow ? 172 : 156;
  const header = narrow ? HEADER : HEADER_WIDE;

  // Lay out the chapters one after another: every chapter's road starts and ends
  // in the left lane where the signposts stand, so they join seamlessly.
  let lessonNumber = 0;
  const sections = width
    ? CURRICULUM.map((chapter, ci) => {
        const color = CHAPTER_COLORS[ci % CHAPTER_COLORS.length]!;
        const earned = chapter.lessons.reduce((n, l) => n + (progress[l.id]?.bestStars ?? 0), 0);
        const total = chapter.lessons.length * 3;
        const done = chapter.lessons.filter((l) => completed.has(l.id)).length;
        const finished = done === chapter.lessons.length;
        const reached = isLessonUnlocked(chapter.lessons[0]!.id, completed);
        const defaultOpen = chapter.lessons.some((l) => l.id === currentLessonId);
        const open = defaultOpen !== toggled.has(chapter.id);
        const last = ci === CURRICULUM.length - 1;

        // stops: lessons + the trophy, rows filled evenly (7 → 4 + 3, not 6 + 1)
        const count = chapter.lessons.length + 1;
        const cols = Math.ceil(count / Math.ceil(count / maxCols));
        // the first column sits exactly under the flag lane → the road runs straight down
        const markerX = width / maxCols / 2;
        const cell = cols > 1 ? (width - 2 * markerX) / (cols - 1) : width;
        const currentIndex = chapter.lessons.findIndex((l) => l.id === currentLessonId);
        const figureSpace = currentIndex >= 0 && currentIndex < cols ? 58 : 6;
        const points = open
          ? layout(count, width, cols, header + figureSpace + 50, rowHeight, markerX)
          : [];
        const markerY = header / 2;
        // open chapters end with room below the last titles for the bend to the next signpost
        const height = open
          ? points[points.length - 1]!.y + (narrow ? 160 : 140) + FOOT
          : header + FOOT;

        // road through this chapter
        // the road always arrives in the signpost lane (chapters bend into it at their end)
        const start = `M ${markerX} ${ci === 0 ? markerY : 0} L ${markerX} ${markerY}`;
        let road = start;
        let travelled = '';
        if (open) {
          const f = points[0]!;
          const leadIn = roundedStep(markerX, markerY, f.x, f.y);
          road += leadIn + continuePath(points);
          const goal = points[points.length - 1]!;
          // leave the trophy downwards and bend into the signpost lane below the titles
          const bendTop = goal.y + (narrow ? 100 : 85);
          if (!last) {
            // …and run straight through the gate of the next world
            road +=
              ` L ${goal.x} ${bendTop}` +
              roundedStep(goal.x, bendTop, markerX, height - FOOT) +
              ` L ${markerX} ${height}`;
          }
          const reachedIndex = finished
            ? points.length - 1
            : chapter.lessons.findIndex((l) => !completed.has(l.id));
          if (finished) travelled = road;
          else if (reached) {
            travelled =
              start +
              leadIn +
              (reachedIndex > 0 ? continuePath(points.slice(0, reachedIndex + 1)) : '');
          }
        } else {
          if (!last) road += ` L ${markerX} ${height}`;
          if (finished) travelled = road;
          else if (reached) travelled = start;
        }

        const lessons = chapter.lessons.map((lesson, i) => {
          lessonNumber++;
          return { lesson, number: lessonNumber, point: points[i] };
        });
        return {
          chapter,
          world: worldOf(chapter.id, ci),
          ci,
          color,
          earned,
          total,
          done,
          finished,
          reached,
          open,
          cols,
          cell,
          points,
          height,
          markerX,
          markerY,
          road,
          travelled,
          lessons,
        };
      })
    : [];

  // remember the worlds that are open now: their fog lifts only this once
  const reachedIds = sections
    .filter((s) => s.reached)
    .map((s) => s.chapter.id)
    .join(',');
  useEffect(() => {
    if (reachedIds) saveRevealed(profileId, reachedIds.split(','));
  }, [profileId, reachedIds]);
  const totalHeight = sections.reduce((h, s) => h + s.height, 0);

  return (
    <div ref={ref} className={classes.map}>
      {title && (
        <div
          className={`${classes.section} ${classes.mapTitle}`}
          style={chapterVars(CHAPTER_COLORS[0]!)}
        >
          {title}
        </div>
      )}
      {sections.map((sec) => {
        const { chapter, world, ci, color, cell, points, height, markerX, markerY } = sec;
        // stones at the edges sit one margin from the border: keep their titles inside
        const labelWidth = Math.min(cell, 2 * markerX + 24);
        const vars = chapterVars(color);
        const rows = points.length ? points[points.length - 1]!.row + 1 : 0;
        const emptyCells = points.length ? rows * sec.cols - points.length : 0;
        // decoration stickers: free spots only, chosen deterministically per chapter
        const kinds = christmas ? CHRISTMAS_STICKERS : world.stickers;
        const kind = (k: number) => kinds[(ci * 2 + k) % kinds.length]!;
        const stickers: { kind: StickerKind; x: number; y: number; size: number; tilt: number }[] =
          [];
        if (points.length) {
          // empty spots in the last row
          for (let k = 0; k < emptyCells; k++) {
            const lastRow = rows - 1;
            const c = sec.cols - 1 - k;
            const col = lastRow % 2 === 0 ? c : sec.cols - 1 - c;
            stickers.push({
              kind: kind(k + 1),
              x: columnX(col, sec.cols, width, sec.markerX),
              y: points[0]!.y + lastRow * rowHeight,
              size: Math.min(56, cell * 0.45),
              tilt: k % 2 ? 12 : -10,
            });
          }
          // small ones in the gaps between rows (between titles and the next row)
          for (let r = 0; r < rows - 1; r++) {
            for (let j = 0; j < sec.cols - 1; j++) {
              if ((j + r + ci) % 3 !== 1) continue;
              stickers.push({
                kind: kind(j + r + 2),
                x:
                  (columnX(j, sec.cols, width, sec.markerX) +
                    columnX(j + 1, sec.cols, width, sec.markerX)) /
                  2,
                y: points[0]!.y + r * rowHeight + rowHeight * 0.6,
                size: 28,
                tilt: (j + r) % 2 ? 14 : -12,
              });
            }
          }
        }
        return (
          <section
            key={chapter.id}
            className={`${classes.section} ${sec.reached ? '' : classes.foggy}`}
            style={{ ...vars, height }}
            aria-labelledby={`chapter-${chapter.id}`}
          >
            <Scenery world={world.id} chapterId={chapter.id} height={height} snowy={christmas} />
            {!narrow && (
              <Landmark
                world={world.id}
                name={t(`path.worlds.${world.id}`)}
                style={{ right: 14, top: markerY - 72 }}
              />
            )}
            {stickers.map((st, k) => (
              <Sticker
                key={k}
                kind={st.kind}
                size={st.size}
                delay={(k * 0.7) % 3}
                style={{
                  left: st.x - st.size / 2,
                  top: st.y - st.size / 2,
                  transform: `rotate(${st.tilt}deg)`,
                }}
              />
            ))}

            {!sec.reached && <Fog />}
            {sec.reached && ci > 0 && !revealed.has(chapter.id) && <Fog lifting />}

            <svg className={classes.road} aria-hidden>
              <path
                d={sec.road}
                fill="none"
                stroke="var(--klavio-road)"
                strokeWidth={30}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {sec.travelled && (
                <path
                  d={sec.travelled}
                  fill="none"
                  className={classes.travelled}
                  strokeWidth={30}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {/* every world has its own road surface */}
              <path
                d={sec.road}
                fill="none"
                stroke={world.road.color}
                strokeOpacity={world.road.opacity}
                strokeWidth={world.road.width}
                strokeDasharray={world.road.dash}
                strokeLinecap={world.road.cap}
              />
            </svg>
            {ci > 0 && (
              <WorldGate style={{ left: markerX - 32, top: -FOOT - 2 }} snowy={christmas} />
            )}

            {/* signpost: a flag on the road, title and status beside it */}
            <ChapterFlag
              number={ci + 1}
              state={sec.finished ? 'done' : sec.reached ? 'open' : 'locked'}
              waving={sec.open && !sec.finished}
              style={{ left: markerX - FLAG_POLE_X, top: markerY - 44 }}
            />
            <UnstyledButton
              className={classes.signpost}
              style={{ left: markerX + 50, right: narrow ? 0 : 200, top: markerY - 40 }}
              aria-expanded={sec.open}
              aria-controls={sec.open ? `chapter-board-${chapter.id}` : undefined}
              onClick={() => toggle(chapter.id)}
              data-testid={`chapter-${chapter.id}`}
            >
              <Box component="span" className={classes.signpostText}>
                <Text component="span" display="block" size="xs" fw={800} tt="uppercase" c="dimmed">
                  {t('path.chapter', { n: ci + 1 })} · {t(`path.worlds.${world.id}`)}
                </Text>
                <Text
                  component="span"
                  display="block"
                  fw={800}
                  fz="lg"
                  id={`chapter-${chapter.id}`}
                >
                  {loc(chapter.title)}
                </Text>
                <Group component="span" gap="xs" wrap="nowrap" className={classes.signpostMeta}>
                  <Group
                    component="span"
                    gap={3}
                    wrap="nowrap"
                    role="img"
                    aria-label={t('path.starsEarned', { earned: sec.earned, total: sec.total })}
                  >
                    <IconStarFilled size={16} color="var(--mantine-color-yellow-6)" aria-hidden />
                    <Text component="span" fw={800} size="sm" aria-hidden>
                      {sec.earned}/{sec.total}
                    </Text>
                  </Group>
                  {sec.finished && (
                    <Text component="span" size="sm" className={classes.doneBadge}>
                      {t('path.goalDone')}
                    </Text>
                  )}
                  {!sec.reached && (
                    <Group component="span" gap={3} wrap="nowrap" c="dimmed">
                      <IconLock size={15} aria-hidden />
                      <Text component="span" fw={700} size="sm">
                        {t('path.lessonCount', { count: chapter.lessons.length })}
                      </Text>
                    </Group>
                  )}
                  <IconChevronDown
                    size={20}
                    aria-hidden
                    className={classes.chevron}
                    data-open={sec.open || undefined}
                  />
                </Group>
              </Box>
            </UnstyledButton>

            {sec.open && (
              <>
                <ol className={classes.list} id={`chapter-board-${chapter.id}`}>
                  {sec.lessons.map(({ lesson, number, point: p }) => {
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
                      t('path.lessonN', { n: number }),
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
                                : 'var(--klavio-empty-star)'
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
                          left: p!.x,
                          top: p!.y - half,
                          width: labelWidth,
                          transform: 'translateX(-50%)',
                        }}
                      >
                        {state === 'locked' ? (
                          <span
                            className={`${classes.node} ${classes.locked}`}
                            role="img"
                            aria-label={label}
                          >
                            <KindIcon lesson={lesson} size={30} />
                            <span className={classes.lockBadge}>
                              <IconLock size={16} aria-hidden />
                            </span>
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
                            <Figure avatar={avatar} mood="happy" size={62} />
                          </span>
                        )}
                        <Text
                          className={`${classes.title} ${current ? classes.titleCurrent : ''}`}
                          maw={labelWidth - 6}
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
                          width: labelWidth,
                          transform: 'translateX(-50%)',
                        }}
                      >
                        <span
                          className={`${classes.node} ${sec.finished ? classes.goalReached : classes.goal}`}
                          role="img"
                          aria-label={t(sec.finished ? 'path.goalReached' : 'path.goal', {
                            n: ci + 1,
                          })}
                          data-testid={`path-goal-${chapter.id}`}
                        >
                          <IconTrophy size={30} aria-hidden />
                        </span>
                        <Text
                          className={`${classes.title} ${sec.finished ? classes.doneBadge : ''}`}
                          maw={labelWidth - 6}
                          fz={narrow ? 12 : 'sm'}
                          aria-hidden
                        >
                          {sec.finished ? t('path.goalDone') : t('path.goalLabel')}
                        </Text>
                      </li>
                    );
                  })()}
                </ol>
              </>
            )}
          </section>
        );
      })}
      {christmas && totalHeight > 0 && <Snowfall height={totalHeight} />}
    </div>
  );
}
