import { Text, Title } from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import { CURRICULUM } from '@klavio/shared';
import { SUMMIT_ALTITUDE, chapterColor, formatAltitude, worldOf } from '../lesson/worlds';
import classes from './Journey.module.css';

const HEIGHT = 230;
const TOP = 34; // room for the summit flag
const BOTTOM = 62; // room for the labels under the lowest point
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
}: {
  completed: Set<string>;
  currentLessonId: string;
  goalTitle?: string;
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
      done: chapter.lessons.every((l) => completed.has(l.id)),
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

  return (
    <section className={classes.card} aria-labelledby="journey-title" data-testid="journey">
      <Text size="sm" fw={800} tt="uppercase" className={classes.kicker}>
        {t('journey.kicker')}
      </Text>
      <Title order={2} size="h3" id="journey-title">
        {goalTitle ? t('journey.titleSong', { title: goalTitle }) : t('journey.title')}
      </Title>
      <Text mt={4} data-testid="journey-phase">
        {t(`journey.phase.${phase}`, { goal: goalTo })}
      </Text>

      <div ref={ref} className={classes.chart}>
        {width > 0 && (
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
              {/* the colour of the ground follows the altitude: meadow, rock, glow */}
              <linearGradient
                id="journey-ground"
                gradientUnits="userSpaceOnUse"
                x1="0"
                y1={TOP}
                x2="0"
                y2={HEIGHT - BOTTOM}
              >
                <stop offset="0" stopColor="var(--mantine-color-indigo-2)" />
                <stop offset="0.3" stopColor="var(--mantine-color-green-3)" />
                <stop offset="0.62" stopColor="var(--mantine-color-gray-4)" />
                <stop offset="0.82" stopColor="var(--mantine-color-orange-5)" />
                <stop offset="1" stopColor="var(--mantine-color-red-8)" />
              </linearGradient>
              <clipPath id="journey-travelled">
                <rect x="0" y="0" width={here.x} height={HEIGHT} />
              </clipPath>
            </defs>

            <path d={area} fill="url(#journey-ground)" opacity="0.55" />
            <line x1={SIDE / 2} x2={w - SIDE / 2} y1={sea} y2={sea} className={classes.sea} />
            <text x={w - SIDE / 2} y={sea - 5} textAnchor="end" className={classes.seaLabel}>
              {t('journey.seaLevel')}
            </text>

            <path d={line} fill="none" className={classes.trail} />
            <path
              d={line}
              fill="none"
              className={classes.travelled}
              clipPath="url(#journey-travelled)"
            />

            {stops.map((s, i) => {
              const p = points[i]!;
              const state = s.done ? 'done' : i === currentIndex ? 'current' : 'later';
              return (
                <g key={s.key} data-state={state}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={i === currentIndex ? 9 : 7}
                    fill={
                      state === 'later'
                        ? 'var(--klavio-surface)'
                        : `var(--mantine-color-${s.color}-6)`
                    }
                    className={classes.stop}
                  />
                  {s.hell && (
                    <path
                      d={`M ${p.x - 7} ${p.y + 22} Q ${p.x - 9} ${p.y + 12} ${p.x - 3} ${p.y + 8} Q ${p.x - 2} ${p.y + 14} ${p.x + 1} ${p.y + 12} Q ${p.x + 1} ${p.y + 6} ${p.x + 5} ${p.y + 4} Q ${p.x + 10} ${p.y + 14} ${p.x + 7} ${p.y + 22} Z`}
                      fill="var(--mantine-color-orange-6)"
                      className={classes.flame}
                    />
                  )}
                  {label(i) && (
                    <text
                      x={p.x}
                      y={s.hell ? p.y + 36 : p.y + 26}
                      textAnchor="middle"
                      className={s.hell ? classes.hellLabel : classes.label}
                    >
                      {s.name}
                    </text>
                  )}
                  {wide && (
                    <text
                      x={p.x}
                      y={(s.hell ? p.y + 36 : p.y + 26) + 14}
                      textAnchor="middle"
                      className={classes.altitude}
                    >
                      {t('journey.altitude', { m: formatAltitude(s.altitude, i18n.language) })}
                    </text>
                  )}
                </g>
              );
            })}

            {/* the summit with the dream song */}
            <g data-state={allDone ? 'done' : 'later'}>
              <path d={`M ${summit.x} ${summit.y} V ${summit.y - 26}`} className={classes.pole} />
              <path
                d={`M ${summit.x + 1} ${summit.y - 26} L ${summit.x + 20} ${summit.y - 20} L ${summit.x + 1} ${summit.y - 14} Z`}
                fill="var(--mantine-color-pink-6)"
              />
              <text
                x={summit.x - 6}
                y={summit.y - 12}
                textAnchor="end"
                className={classes.summitLabel}
              >
                {goal.length > 22 ? `${goal.slice(0, 21)}…` : goal}
              </text>
            </g>

            {/* you are here */}
            <g className={classes.here} transform={`translate(${here.x} ${here.y})`}>
              <circle r="15" className={classes.pulse} />
              <path
                d="M0 -12 C -8 -12 -10 -22 -10 -26 A 10 10 0 1 1 10 -26 C 10 -22 8 -12 0 -12 Z"
                fill="var(--mantine-primary-color-filled)"
              />
              <circle cy="-26" r="4" fill="#fff" />
            </g>
          </svg>
        )}
      </div>
    </section>
  );
}
