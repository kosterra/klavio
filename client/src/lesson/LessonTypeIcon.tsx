import {
  IconEar,
  IconFileMusic,
  IconMetronome,
  IconMusic,
  IconPiano,
  IconPlayerPlay,
  IconSparkles,
  IconStack2,
  IconVolume,
  type Icon,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { LESSON_TYPES, type LessonType } from './lessonType';
import classes from './LearningPath.module.css';

const ICONS: Record<LessonType, Icon> = {
  keys: IconPiano,
  play: IconPlayerPlay,
  read: IconFileMusic,
  song: IconMusic,
  rhythm: IconMetronome,
  ear: IconEar,
  chords: IconStack2,
  expression: IconVolume,
  improvise: IconSparkles,
};

export function LessonTypeIcon({ type, size }: { type: LessonType; size: number }) {
  const I = ICONS[type];
  return <I size={size} aria-hidden />;
}

/** «Was bedeuten die Zeichen?» – the lesson types under the learning path. */
export function PathLegend() {
  const { t } = useTranslation();
  return (
    <details className={classes.legend} data-testid="path-legend">
      <summary>{t('path.legend')}</summary>
      <ul>
        {LESSON_TYPES.map((type) => (
          <li key={type}>
            <span className={classes.legendIcon}>
              <LessonTypeIcon type={type} size={20} />
            </span>
            {t(`path.types.${type}`)}
          </li>
        ))}
      </ul>
    </details>
  );
}
