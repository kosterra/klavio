import { Text, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { CURRICULUM } from '@klavio/shared';
import { Landmark } from './Landmarks';
import { useLocalized } from './useLocalized';
import { useWorldMode } from './useWorldMode';
import { chapterColor, chapterVars, worldOf } from './worlds';
import classes from './WorldDone.module.css';

/**
 * A whole world finished: its landmark, a shower of notes and stars, and
 * where the road goes next.
 */
export function WorldDone({ lessonId }: { lessonId: string }) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const set = useWorldMode();
  const ci = CURRICULUM.findIndex((c) => c.lessons.some((l) => l.id === lessonId));
  const world = worldOf(CURRICULUM[ci]!.id, ci, set);
  const next = CURRICULUM[ci + 1];
  const nextWorld = next ? worldOf(next.id, ci + 1, set) : null;
  return (
    <section
      className={classes.card}
      style={chapterVars(chapterColor(world, ci))}
      aria-labelledby="world-done"
      data-testid="world-done"
    >
      <div className={classes.confetti} aria-hidden>
        {Array.from({ length: 14 }, (_, i) => (
          <span
            key={i}
            className={classes.bit}
            style={
              {
                left: `${(i * 61.8) % 100}%`,
                animationDelay: `${(i % 7) * 0.12}s`,
                '--turn': `${(i % 2 ? 1 : -1) * (120 + i * 20)}deg`,
              } as React.CSSProperties
            }
          >
            {i % 3 === 0 ? '★' : i % 3 === 1 ? '♪' : '♫'}
          </span>
        ))}
      </div>
      <Landmark
        world={world.id}
        name={t(`path.worlds.${world.id}`)}
        style={{ position: 'static', margin: '0 auto' }}
      />
      <Title order={2} ta="center" id="world-done" mt="sm">
        {t('worldDone.title', { world: t(`path.worlds.${world.id}`) })}
      </Title>
      <Text ta="center" mt={4}>
        {nextWorld
          ? t('worldDone.next', {
              world: t(`path.worlds.${nextWorld.id}`),
              chapter: loc(next!.title),
            })
          : t('worldDone.last')}
      </Text>
    </section>
  );
}
