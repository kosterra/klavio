import { useTranslation } from 'react-i18next';
import { CURRICULUM } from '@klavio/shared';
import { Landmark } from './Landmarks';
import { CHAPTER_COLORS, chapterVars, worldOf } from './worlds';
import classes from './WorldPanorama.module.css';

/**
 * All worlds side by side on rolling hills – a peek at the journey on
 * the welcome and profile screens. Purely decorative.
 */
export function WorldPanorama() {
  const { t } = useTranslation();
  return (
    <div className={classes.panorama} aria-hidden>
      <svg className={classes.hills} viewBox="0 0 1000 80" preserveAspectRatio="none">
        <path
          d="M0 80 V40 Q125 0 250 34 T500 30 T750 34 T1000 36 V80 Z"
          fill="color-mix(in srgb, var(--mantine-color-teal-4) 30%, var(--klavio-surface))"
        />
        <path
          d="M0 80 V56 Q160 30 330 52 T660 50 T1000 54 V80 Z"
          fill="color-mix(in srgb, var(--mantine-color-teal-5) 42%, var(--klavio-surface))"
        />
      </svg>
      <div className={classes.row}>
        {CURRICULUM.map((c, i) => {
          const world = worldOf(c.id, i);
          return (
            <div
              key={c.id}
              className={classes.item}
              style={chapterVars(CHAPTER_COLORS[i % CHAPTER_COLORS.length]!)}
            >
              <Landmark
                world={world.id}
                name={t(`path.worlds.${world.id}`)}
                style={{ position: 'static' }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
