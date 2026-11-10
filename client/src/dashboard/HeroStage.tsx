import { Text, Title } from '@mantine/core';
import { IconPlayerPlayFilled } from '@tabler/icons-react';
import { useMediaQuery } from '@mantine/hooks';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import type { Lesson } from '@klavio/shared';
import { Buddy } from '../components/Buddy';
import { Landmark } from '../lesson/Landmarks';
import { Scenery } from '../lesson/WorldScenery';
import { useLocalized } from '../lesson/useLocalized';
import { worldOfLesson } from '../lesson/worlds';
import { useWorldMode } from '../lesson/useWorldMode';
import classes from './Dashboard.module.css';
import { useLessonFor } from '../lesson/useLessonFor';
import { SeasonDecor } from '../season/SeasonDecor';
import { hasPiece } from '../season/season';
import { useSeason } from '../season/useSeason';

/**
 * Kids' greeting as a little stage in the colours of the world the learner is
 * in: sky, landscape and landmark, the own figure with a speech bubble and one
 * big "play" button – the most important thing on the page.
 */
export function HeroStage({
  name,
  lesson,
  firstTime,
  allDone,
  greeting,
}: {
  name: string;
  lesson: Lesson | null;
  firstTime: boolean;
  allDone: boolean;
  greeting: string;
}) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const forMe = useLessonFor();
  const where = worldOfLesson(lesson?.id ?? '', useWorldMode());
  const narrow = useMediaQuery('(max-width: 36em)') ?? false;
  const season = useSeason();
  return (
    <section className={classes.hero} style={where.vars} aria-labelledby="hero-title">
      <div className={classes.heroScenery} aria-hidden>
        <Scenery
          world={where.world.id}
          chapterId="hero"
          height={40}
          snowy={hasPiece(season, 'snow')}
        />
      </div>
      <Landmark
        world={where.world.id}
        name={t(`path.worlds.${where.world.id}`)}
        style={{ right: 24, bottom: 18 }}
        className={classes.heroLandmark}
      />
      <SeasonDecor season={season} />
      <div className={classes.heroContent}>
        <div className={classes.heroTalk}>
          <div className={classes.heroFigure}>
            <Buddy mood="cheer" size={narrow ? 72 : 120} />
          </div>
          <div className={classes.heroBubble}>
            <Title order={1} id="hero-title" className={classes.heroTitle}>
              {season.phase === 'christmas'
                ? t('season.christmas', { name })
                : season.phase === 'newyear' && season.greeting === 'eve'
                  ? t('season.eve', { name })
                  : season.phase === 'newyear' && season.greeting === 'new'
                    ? t('season.newYear', { name, year: season.year })
                    : t('dashboard.greeting', { name })}
            </Title>
            <Text fz="lg">{allDone ? t('dashboard.allDone') : greeting}</Text>
          </div>
        </div>
        {lesson && !allDone && (
          <Link to={`/lesson/${lesson.id}`} className={classes.playStone}>
            <span className={classes.playIcon} aria-hidden>
              <IconPlayerPlayFilled size={28} />
            </span>
            <span className={classes.playText}>
              <span className={classes.playWorld}>
                {t('path.chapter', { n: where.index + 1 })} · {t(`path.worlds.${where.world.id}`)}
              </span>
              <span className={classes.playLabel}>
                {firstTime
                  ? t('dashboard.startFirst')
                  : t('dashboard.continue', { lesson: loc(forMe(lesson).title) })}
              </span>
            </span>
          </Link>
        )}
      </div>
    </section>
  );
}
