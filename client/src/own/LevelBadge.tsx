import { IconCircleCheckFilled } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { PieceLevel } from '@klavio/shared';
import classes from './PieceRow.module.css';

/**
 * How hard a piece is, at a glance: five dots and a word (Stufe 1–3 of the
 * path, then «Fortgeschritten» and «Anspruchsvoll»), and «Passt jetzt» when
 * this profile has done the lessons it needs.
 */
export function LevelBadge({ level, ready = false }: { level: PieceLevel; ready?: boolean }) {
  const { t } = useTranslation();
  return (
    <span className={classes.badges}>
      <span className={classes.level} data-level={level} data-testid="level">
        <span className={classes.dots} aria-hidden>
          {[1, 2, 3, 4, 5].map((i) => (
            <span key={i} data-on={i <= level || undefined} />
          ))}
        </span>
        {t(`level.${level}`)}
      </span>
      {ready && (
        <span className={classes.ready}>
          <IconCircleCheckFilled size={16} aria-hidden />
          {t('level.ready')}
        </span>
      )}
    </span>
  );
}
