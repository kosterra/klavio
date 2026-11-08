import { Card, Text, Title } from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import { CURRICULUM, coreLessons, type Avatar, type Outfit } from '@klavio/shared';
import { Figure } from '../components/Figure';
import { SUMMIT_ALTITUDE, chapterColor, formatAltitude, worldOf } from '../lesson/worlds';
import classes from './Journey.module.css';

const HEIGHT = 250;
const TOP = 62; // room for the figure and the summit flag
const BOTTOM = 64; // room for the labels under the lowest point
const SIDE = 34;

/** A smooth line through the points (Catmull-Rom as cubic Béziers). */
function smooth(points: { x: number; y: number }[]): string {
  return points
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const p0 = points[i - 2] ?? points[i - 1]!;
      const p1 = points[i - 1]!;
      const p3 = points[i + 1] ?? p;
      const c1 = { x: p1.x + (p.x - p0.x) / 6, y: p1.y + (p.y - p0.y) / 6 };
      const c2 = { x: p.x - (p3.x - p1.x) / 6, y: p.y - (p3.y - p1.y) / 6 };
      return `C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p.x} ${p.y}`;
    })
    .join(' ');
}

/**
 * The adults' journey as an elevation profile: down from the alp into «Die
 * Hölle» (the hardest chapter), then up to the summit where the dream song
 * waits – with where one is now. Hard stretches are part of the way, and the
 * picture says so before they come.
 */
export function JourneyProfile({
  completed,
  currentLessonId,
  goalTitle,
  avatar,
  outfit,
  embedded = false,
}: {
  completed: Set<string>;
  currentLessonId: string;
  goalTitle?: string;
  /** the learner's figure stands where they are, as on the learning path */
  avatar: Avatar;
  outfit?: Outfit | null;
  /** inside the dream song card: no frame and no heading of its own */
  embedded?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const { ref, width } = useElementSize();

  const stops = CURRICULUM.map((chapter, ci) => {
    const world = worldOf(chapter.id, ci, 'journey');
    return {
      key: chapter.id,
      name: t(`path.worlds.${world.id}`),
      altitude: world.altitude ?? 0,
      color: chapterColor(world, ci),
      done: coreLessons(chapter).every((l) => completed.has(l.id)),
      hell: world.id === 'hell',
    };
  });
  const allDone = stops.every((s) => s.done);
  const currentIndex = allDone
    ? stops.length
    : Math.max(
        0,
        CURRICULUM.findIndex((c) => c.lessons.some((l) => l.id === currentLessonId)),
      );
  const hellIndex = stops.findIndex((s) => s.hell);
  const deepest = Math.min(...stops.map((s) => s.altitude));
  const all = [...stops.map((s) => s.altitude), SUMMIT_ALTITUDE];

  const phase = allDone
    ? 'summit'
    : currentIndex < hellIndex
      ? 'down'
      : currentIndex === hellIndex
        ? 'hell'
        : 'up';
  const goal = goalTitle || t('journey.dreamSong');
  // in a sentence: «zu deinem Traumlied» / «zu «Für Elise»»
  const goalTo = goalTitle ? `«${goalTitle}»` : t('journey.dreamSongTo');

  const w = Math.max(width, 280);
  const wide = w >= 600;
  const step = (w - 2 * SIDE) / stops.length;
  const yOf = (m: number) =>
    TOP + ((SUMMIT_ALTITUDE - m) / (SUMMIT_ALTITUDE - deepest)) * (HEIGHT - TOP - BOTTOM);
  const points = all.map((m, i) => ({ x: SIDE + i * step, y: yOf(m) }));
  const line = smooth(points);
  const area = `${line} L ${points.at(-1)!.x} ${HEIGHT} L ${points[0]!.x} ${HEIGHT} Z`;
  const here = points[currentIndex]!;
  const sea = yOf(0);
  const summit = points.at(-1)!;

  const label = (i: number) => wide || i === currentIndex || i === hellIndex;
  // stones with their number where there is room, small dots on phones
  const roomy = step >= 34;
  const STONE = roomy ? 13 : 7;

  // each stretch of land in its world's colour, as on the learning path
  const edges = points.map((p, i) => ({
    from: i === 0 ? 0 : (points[i - 1]!.x + p.x) / 2,
    to: i === points.length - 1 ? w : (p.x + points[i + 1]!.x) / 2,
  }));
  const colorOf = (i: number) => (i < stops.length ? stops[i]!.color : 'pink');

  const phaseText = (
    <Text mt={embedded ? 'md' : 4} data-testid="journey-phase">
      {t(`journey.phase.${phase}`, { goal: goalTo })}
    </Text>
  );

  const chart = (
    <div ref={ref} className={classes.chart}>
      {width > 0 && (
        <>
          <svg
            width={w}
            height={HEIGHT}
            viewBox={`0 0 ${w} ${HEIGHT}`}
            role="img"
            aria-label={t('journey.summary', {
              n: Math.min(currentIndex + 1, stops.length),
              total: stops.length,
              world: stops[Math.min(currentIndex, stops.length - 1)]!.name,
              hell: stops[hellIndex]?.name ?? '',
              goal: goalTo,
            })}
          >
            <defs>
              <clipPath id="journey-land">
                <path d={area} />
              </clipPath>
              <clipPath id="journey-travelled">
                <rect x="0" y="0" width={here.x} height={HEIGHT} />
              </clipPath>
            </defs>

            {/* the land, world by world */}
            <g clipPath="url(#journey-land)">
              {edges.map((e, i) => (
                <rect
                  key={i}
                  x={e.from}
                  y="0"
                  width={e.to - e.from}
                  height={HEIGHT}
                  fill={`color-mix(in srgb, var(--mantine-color-${colorOf(i)}-5) ${
                    i === hellIndex ? 40 : 26
                  }%, var(--klavio-surface))`}
                />
              ))}
            </g>
            <line x1={SIDE / 2} x2={w - SIDE / 2} y1={sea} y2={sea} className={classes.sea} />
            <text x={w - SIDE / 2} y={sea - 5} textAnchor="end" className={classes.seaLabel}>
              {t('journey.seaLevel')}
            </text>
            {/* the road along the surface: grey ahead, coloured where one has been */}
            <path d={line} className={classes.road} />
            <path d={line} className={classes.travelled} clipPath="url(#journey-travelled)" />
            <path d={line} className={classes.edge} />

            {/* the fire at the lowest point */}
            {hellIndex >= 0 && (
              <g transform={`translate(${points[hellIndex]!.x} ${points[hellIndex]!.y + 4})`}>
                <g className={classes.flame}>
                  <path
                    d="M-18 0 Q-22 -16 -10 -24 Q-10 -14 -4 -12 Q-8 -28 4 -38 Q4 -24 10 -20 Q12 -30 18 -30 Q24 -14 18 0 Z"
                    fill="var(--mantine-color-orange-5)"
                    className={classes.ink}
                  />
                  <path
                    d="M-9 0 Q-11 -9 -4 -13 Q-3 -6 2 -8 Q2 -16 8 -18 Q14 -8 9 0 Z"
                    fill="var(--mantine-color-yellow-4)"
                  />
                </g>
              </g>
            )}

            {stops.map((s, i) => {
              const p = points[i]!;
              const state = s.done ? 'done' : i === currentIndex ? 'current' : 'later';
              const below = p.y + STONE + 16;
              return (
                <g key={s.key} data-state={state}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={STONE}
                    fill={
                      state === 'done'
                        ? `var(--mantine-color-${s.color}-6)`
                        : state === 'current'
                          ? 'var(--mantine-color-orange-6)'
                          : 'var(--klavio-locked-bg)'
                    }
                    className={classes.ink}
                  />
                  {roomy && (
                    <text
                      x={p.x}
                      y={p.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className={state === 'later' ? classes.numberLocked : classes.number}
                    >
                      {i + 1}
                    </text>
                  )}
                  {label(i) && (
                    <text
                      x={p.x}
                      y={below}
                      textAnchor="middle"
                      className={s.hell ? classes.hellLabel : classes.label}
                    >
                      {s.name}
                    </text>
                  )}
                  {wide && (
                    <text x={p.x} y={below + 14} textAnchor="middle" className={classes.altitude}>
                      {t('journey.altitude', { m: formatAltitude(s.altitude, i18n.language) })}
                    </text>
                  )}
                </g>
              );
            })}

            {/* the summit with the dream song: a flag like the chapter flags */}
            <g transform={`translate(${summit.x} ${summit.y})`}>
              <rect x="-2.5" y="-46" width="5" height="46" rx="2.5" className={classes.pole} />
              <circle cy="-46" r="4.5" fill="var(--mantine-color-yellow-6)" />
              <path
                d="M2 -42 Q14 -46 30 -40 Q24 -32 30 -24 Q14 -28 2 -22 Z"
                fill="var(--mantine-color-pink-6)"
                className={classes.ink}
              />
              <text x="-8" y="-28" textAnchor="end" className={classes.summitLabel}>
                {goal.length > 22 ? `${goal.slice(0, 21)}…` : goal}
              </text>
            </g>
          </svg>
          {/* you are here: the learner's own figure, as on the learning path */}
          <span
            className={classes.figure}
            style={{ left: here.x - 24, top: here.y - STONE - 50 }}
            data-testid="journey-figure"
          >
            <Figure avatar={avatar} outfit={outfit} mood="happy" size={48} still />
          </span>
        </>
      )}
    </div>
  );

  if (embedded) {
    return (
      <div data-testid="journey">
        {phaseText}
        {chart}
      </div>
    );
  }
  return (
    <Card
      withBorder
      radius="xl"
      padding="lg"
      aria-labelledby="journey-title"
      data-testid="journey"
      component="section"
    >
      <Text size="sm" fw={800} tt="uppercase" c="dimmed" className={classes.kicker}>
        {t('journey.kicker')}
      </Text>
      <Title order={2} size="h3" id="journey-title">
        {goalTitle ? t('journey.titleSong', { title: goalTitle }) : t('journey.title')}
      </Title>
      {phaseText}
      {chart}
    </Card>
  );
}
