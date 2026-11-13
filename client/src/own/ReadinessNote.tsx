import { Anchor, Text } from '@mantine/core';
import { IconCircleCheck, IconRoute } from '@tabler/icons-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  CURRICULUM,
  isLessonUnlocked,
  pieceReadiness,
  type PieceExercise,
  type SongExercise,
} from '@klavio/shared';
import { useLocalized } from '../lesson/useLocalized';
import { useLessonFor } from '../lesson/useLessonFor';
import classes from './Own.module.css';

/**
 * «Ab wann?»: the lesson of the path after which a piece can be played, and
 * what is still missing for it. A recommendation, not a lock – the piece can
 * always be tried.
 */
export function ReadinessNote({
  exercise,
  completed,
  compact = false,
}: {
  exercise: SongExercise | PieceExercise;
  /** the lessons this profile has done (null while loading) */
  completed: ReadonlySet<string> | null;
  /** one line, for lists */
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const forMe = useLessonFor();
  const r = pieceReadiness(exercise);
  const done = completed ?? new Set<string>();
  const missing = r.needs.filter((n) => !done.has(n.lessonId) && n.need !== 'keys');
  const ready = completed !== null && done.has(r.lesson.id);
  const title = loc(forMe(r.lesson).title);
  const chapter = CURRICULUM.findIndex((c) => c.lessons.some((l) => l.id === r.lesson.id)) + 1;
  const beyond = r.beyond.map((b) => t(`readiness.beyond.${b}`)).join(', ');

  if (compact) {
    return (
      <Text size="sm" className={classes.readyLine} data-ready={ready || undefined} truncate>
        {ready ? t('readiness.readyShort') : t('readiness.afterShort', { lesson: title })}
        {beyond && ` · ${t('readiness.beyondShort', { list: beyond })}`}
      </Text>
    );
  }
  return (
    <div className={classes.ready} data-ready={ready || undefined} data-testid="readiness">
      {ready ? (
        <IconCircleCheck size={22} aria-hidden className={classes.readyIcon} />
      ) : (
        <IconRoute size={22} aria-hidden className={classes.readyIcon} />
      )}
      <div>
        <Text fw={700} size="sm">
          {ready
            ? t('readiness.ready', { lesson: title })
            : t('readiness.after', { lesson: title, chapter })}
        </Text>
        {!ready && missing.length > 0 && (
          <Text size="sm">
            {t('readiness.missing', {
              list: missing.map((n) => t(`readiness.needs.${n.need}`)).join(', '),
            })}{' '}
            {isLessonUnlocked(missing[0]!.lessonId, done) && (
              <Anchor component={Link} to={`/lesson/${missing[0]!.lessonId}`} fw={700} size="sm">
                {t('readiness.go', {
                  lesson: loc(
                    forMe(
                      CURRICULUM.flatMap((c) => c.lessons).find(
                        (l) => l.id === missing[0]!.lessonId,
                      )!,
                    ).title,
                  ),
                })}
              </Anchor>
            )}
          </Text>
        )}
        {beyond && (
          <Text size="sm" mt={2}>
            {t('readiness.beyondText', { list: beyond })}
          </Text>
        )}
      </div>
    </div>
  );
}
