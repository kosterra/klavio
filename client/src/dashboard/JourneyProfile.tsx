import { Card, Text, Title } from '@mantine/core';
import { IconCheck, IconCloudStorm, IconFlag3, IconMedal, IconMusic } from '@tabler/icons-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { CURRICULUM, coreLessons, findLesson, type Avatar, type Outfit } from '@klavio/shared';
import { Figure } from '../components/Figure';
import { useLocalized } from '../lesson/useLocalized';
import { worldOf } from '../lesson/worlds';
import classes from './Journey.module.css';

type StageId = 'start' | 'grind' | 'climb' | 'summit';

/**
 * The journey in four stages instead of eleven stops – a story one can keep in
 * mind. Each stage names what one can play afterwards; the second one, down
 * into «Die Hölle», is announced honestly as the hard stretch, with what helps.
 */
const STAGES: { id: StageId; chapters: string[]; reward?: string; color: string }[] = [
  { id: 'start', chapters: ['keys', 'hand', 'read'], reward: 'hand-entchen', color: 'green' },
  { id: 'grind', chapters: ['songs', 'rhythm', 'bass'], reward: 'bass-lamb', color: 'red' },
  { id: 'climb', chapters: ['both', 'black', 'meter'], reward: 'meter-upbeat', color: 'indigo' },
  // the summit's reward is the dream song itself
  { id: 'summit', chapters: ['keysigs', 'accomp'], color: 'pink' },
];
const HARD: StageId = 'grind';

/**
 * «Deine Reise» for adults: the dream song as the summit on top, below it the
 * four stages of the way there – the current one open with its chapters, the
 * hard one with a storm cloud and what gets one through, and how long the
 * climb takes with one's weekly goal.
 */
export function JourneyProfile({
  completed,
  currentLessonId,
  goalTitle,
  avatar,
  outfit,
  weeklyGoalDays,
  embedded = false,
}: {
  completed: Set<string>;
  currentLessonId: string;
  goalTitle?: string;
  /** the learner's figure stands where they are, as on the learning path */
  avatar: Avatar;
  outfit?: Outfit | null;
  /** practice days per week, for the estimate; null: no goal set */
  weeklyGoalDays?: number | null;
  /** inside the dream song card: no frame and no heading of its own */
  embedded?: boolean;
}) {
  const { t } = useTranslation();
  const loc = useLocalized();

  const chapterIndex = (id: string) => CURRICULUM.findIndex((c) => c.id === id);
  const currentChapter = CURRICULUM.findIndex((c) =>
    c.lessons.some((l) => l.id === currentLessonId),
  );
  const chapterDone = (ci: number) =>
    coreLessons(CURRICULUM[ci]!).every((l) => completed.has(l.id));

  const stages = STAGES.map((s) => {
    const idx = s.chapters.map(chapterIndex).filter((i) => i >= 0);
    const done = idx.every(chapterDone);
    return { ...s, idx, done };
  });
  const allDone = stages.every((s) => s.done);
  const currentStage = allDone ? -1 : stages.findIndex((s) => !s.done);
  const phase = allDone ? 'done' : stages[currentStage]!.id;

  const goal = goalTitle || t('journey.dreamSong');
  const goalTo = goalTitle ? `«${goalTitle}»` : t('journey.dreamSongTo');
  const remaining = CURRICULUM.flatMap(coreLessons).filter((l) => !completed.has(l.id)).length;
  const weeks = weeklyGoalDays ? Math.max(1, Math.ceil(remaining / weeklyGoalDays)) : null;
  const worldName = (ci: number) =>
    t(`path.worlds.${worldOf(CURRICULUM[ci]!.id, ci, 'journey').id}`);

  const phaseText = (
    <Text mt={embedded ? 'md' : 4} data-testid="journey-phase">
      {t(`journey.phase.${phase}`, {
        goal:
          phase === 'summit' ? (goalTitle ? `«${goalTitle}»` : t('journey.dreamSongFor')) : goalTo,
      })}
    </Text>
  );

  const summit = (
    <div className={classes.summit} data-reached={allDone || undefined}>
      <svg className={classes.peak} viewBox="0 0 120 70" aria-hidden>
        <path d="M4 68 L46 18 L62 34 L76 10 L116 68 Z" className={classes.rock} />
        <path d="M76 10 L86 24 L80 22 L74 28 L68 20 Z" className={classes.snow} />
        <path d="M46 18 L54 28 L48 26 L42 30 L40 25 Z" className={classes.snow} />
        <rect x="74.5" y="-14" width="3" height="25" rx="1.5" className={classes.pole} />
        <path d="M77.5 -13 Q88 -16 98 -11 Q93 -6 98 -1 Q88 -5 77.5 -2 Z" className={classes.flag} />
      </svg>
      <div className={classes.summitText}>
        <Text size="xs" fw={800} tt="uppercase" className={classes.summitKicker}>
          {t('journey.summitKicker')}
        </Text>
        <Text fw={900} fz="xl" lh={1.2} className={classes.summitTitle}>
          {goal}
        </Text>
        {!allDone && (
          <Text size="sm" mt={4} data-testid="journey-estimate">
            {weeks !== null ? (
              t('journey.estimate', { count: weeks, days: weeklyGoalDays })
            ) : (
              <>
                {t('journey.estimateNone')} <Link to="/profile">{t('journey.setWeeklyGoal')}</Link>
              </>
            )}
          </Text>
        )}
      </div>
    </div>
  );

  const list = (
    <ol className={classes.stages} aria-label={t('journey.stagesLabel')}>
      {stages.map((s, si) => {
        const state = s.done ? 'done' : si === currentStage ? 'current' : 'later';
        const hard = s.id === HARD;
        const reward = s.reward ? findLesson(s.reward) : undefined;
        const rewardTitle = reward
          ? `«${loc(reward.title)}»`
          : goalTitle
            ? `«${goalTitle}»`
            : t('journey.dreamSongFor');
        return (
          <li
            key={s.id}
            className={classes.stage}
            data-state={state}
            data-hard={hard || undefined}
            style={{ '--stage-color': `var(--mantine-color-${s.color}-6)` } as React.CSSProperties}
            data-testid={`stage-${s.id}`}
          >
            <span className={classes.marker} aria-hidden>
              {state === 'done' ? (
                <IconCheck size={20} stroke={3} />
              ) : state === 'current' ? (
                <Figure avatar={avatar} outfit={outfit} mood="happy" size={32} still />
              ) : (
                si + 1
              )}
            </span>
            <div className={classes.stageBody}>
              <div className={classes.stageHead}>
                <Text fw={900} fz="lg" lh={1.2}>
                  <span className={classes.stageN}>{t('journey.stageN', { n: si + 1 })}</span>
                  {t(`journey.stages.${s.id}`)}
                </Text>
                {state === 'current' && (
                  <span className={classes.here} data-testid="journey-figure">
                    {t('journey.here')}
                  </span>
                )}
                {hard && state !== 'done' && (
                  <IconCloudStorm size={26} className={classes.storm} aria-hidden />
                )}
              </div>
              <Text size="sm" c="dimmed" fw={700}>
                {s.idx.map(worldName).join(' · ')}
              </Text>

              <Text size="sm" mt={6} className={classes.reward}>
                {state === 'done' ? (
                  <IconMedal size={16} aria-hidden />
                ) : s.id === 'summit' ? (
                  <IconFlag3 size={16} aria-hidden />
                ) : (
                  <IconMusic size={16} aria-hidden />
                )}
                <span>
                  {state === 'done'
                    ? hard
                      ? t('journey.survived')
                      : t('journey.rewardDone', { song: rewardTitle })
                    : t(s.reward ? 'journey.reward' : 'journey.rewardSummit', {
                        song: rewardTitle,
                      })}
                </span>
              </Text>

              {/* the hard stretch: said before it comes, with what helps */}
              {hard && state !== 'done' && (
                <div className={classes.hard} data-testid="journey-hard">
                  <Text fw={800} size="sm">
                    {t('journey.hardTitle')}
                  </Text>
                  <Text size="sm">{t('journey.hardText')}</Text>
                  <ul className={classes.helps}>
                    {(['tips', 'short', 'week'] as const).map((k) => (
                      <li key={k}>{t(`journey.help.${k}`)}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* where one is: the stage's chapters, one by one */}
              {state === 'current' && (
                <ul className={classes.chapters}>
                  {s.idx.map((ci) => {
                    const ch = CURRICULUM[ci]!;
                    const core = coreLessons(ch);
                    const n = core.filter((l) => completed.has(l.id)).length;
                    const cs =
                      n === core.length ? 'done' : ci === currentChapter ? 'current' : 'later';
                    return (
                      <li key={ch.id} data-state={cs}>
                        <span className={classes.chapterDot} aria-hidden>
                          {cs === 'done' ? <IconCheck size={12} stroke={3} /> : ci + 1}
                        </span>
                        <span className={classes.chapterName}>
                          {worldName(ci)}: {loc(ch.title)}
                        </span>
                        <span className={classes.chapterCount}>
                          {t('journey.lessonsOf', { n, total: core.length })}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );

  const body = (
    <div className={classes.expedition}>
      {summit}
      {list}
    </div>
  );

  if (embedded) {
    return (
      <div data-testid="journey">
        {phaseText}
        {body}
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
      {body}
    </Card>
  );
}
