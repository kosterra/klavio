import { useState } from 'react';
import { Button, Group, Switch, Text } from '@mantine/core';
import { IconArrowLeft, IconPrinter } from '@tabler/icons-react';
import { Link, Navigate, useParams } from 'react-router';
import { useMediaQuery } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import {
  CURRICULUM,
  findLesson,
  isLessonUnlocked,
  localIsoDate,
  midiToPitchName,
  songFingers,
  type Exercise,
  type PieceExercise,
  type SongExercise,
  type TimedSongExercise,
} from '@klavio/shared';
import { useSession } from '../auth/session';
import { Staff, type StaffNote } from '../notation/Staff';
import { GrandStaff } from '../notation/GrandStaff';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { usePageTitle } from '../components/usePageTitle';
import { useProgress } from '../lesson/useProgress';
import { useLessonFor } from '../lesson/useLessonFor';
import { useLocalized } from '../lesson/useLocalized';
import { useWorldMode } from '../lesson/useWorldMode';
import { chapterColor, worldOf } from '../lesson/worlds';
import classes from './SongSheet.module.css';

type Printable = SongExercise | TimedSongExercise | PieceExercise;

/** bars per line on paper: four fit an A4 page in a readable size (two on a phone's preview) */
const BARS_PER_LINE = 4;
const BARS_PER_LINE_NARROW = 2;

function printable(exercises: Exercise[]): Printable | undefined {
  return exercises.find(
    (e): e is Printable => e.type === 'song' || e.type === 'song-timed' || e.type === 'piece',
  );
}

/** a short last line keeps the bar width of the full ones (the first line also has the clef) */
function lineWidth(count: number, index: number, per: number): string {
  if (count >= per || index === 0) return '100%';
  return `${Math.max(40, Math.round((count / per) * 100 + 4))}%`;
}

function lines<T>(bars: T[], per: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < bars.length; i += per) out.push(bars.slice(i, i + per));
  return out;
}

/**
 * A song as a sheet to print, in Klavio's look: the colour stripe and the
 * logo, the song with its world, the notes (with names and fingers if wanted),
 * a little practice tip from Klavi and a week to tick off. The buttons are
 * only on the screen, never on paper.
 */
export function SongSheetPage() {
  const { lessonId = '' } = useParams();
  const { t } = useTranslation();
  const loc = useLocalized();
  const forMe = useLessonFor();
  const worldSet = useWorldMode();
  const { completed, progress } = useProgress();
  const base = findLesson(lessonId);
  const lesson = base ? forMe(base) : undefined;
  usePageTitle(lesson ? t('sheet.pageTitle', { title: loc(lesson.title) }) : t('sheet.title'));
  const exercise = lesson ? printable(lesson.exercises) : undefined;

  if (!base || !lesson || !exercise) return <Navigate to="/songs" replace />;
  if (progress && !isLessonUnlocked(base.id, completed)) return <Navigate to="/songs" replace />;

  const ci = CURRICULUM.findIndex((c) => c.lessons.some((l) => l.id === base.id));
  const world = ci >= 0 ? worldOf(CURRICULUM[ci]!.id, ci, worldSet) : null;
  return (
    <SheetView
      title={loc(lesson.title)}
      exercise={exercise}
      chip={
        world
          ? {
              text: t('sheet.where', { n: ci + 1, world: t(`path.worlds.${world.id}`) }),
              color: chapterColor(world, ci),
            }
          : null
      }
      note={t('sheet.publicDomain')}
    />
  );
}

/** The sheet itself – for a song of the course or an own piece. */
export function SheetView({
  title,
  exercise,
  chip,
  note,
  backTo = '/songs',
}: {
  title: string;
  exercise: Printable;
  /** top right: where it comes from (the world of a song), in its colour */
  chip: { text: string; color: string } | null;
  /** bottom right: e.g. «Melodie gemeinfrei» or the composer */
  note: string;
  /** where «back» leads */
  backTo?: string;
}) {
  const { t, i18n } = useTranslation();
  const { activeProfile } = useSession();
  const [names, setNames] = useState(() => !!exercise.showNames);
  const [fingers, setFingers] = useState(true);
  const narrow = useMediaQuery('(max-width: 36em)') ?? false;
  const per = narrow ? BARS_PER_LINE_NARROW : BARS_PER_LINE;
  const lang = i18n.language.startsWith('de') ? 'de' : 'en';
  const kids = activeProfile?.uiMode !== 'classic';
  const name = (midi: number) => (names ? midiToPitchName(midi, lang) : undefined);
  const days = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(i18n.language, { weekday: 'short' }).format(
      new Date(Date.UTC(2026, 10, 2 + i, 12)), // a Monday … Sunday
    ),
  );

  let music: React.ReactNode;
  if (exercise.type === 'piece') {
    const toStaff = (notes: PieceExercise['bars'][number]['rh']): StaffNote[] =>
      notes.map((n) => ({
        midi: n.midi ?? 60,
        duration: n.value,
        label: n.midi === null ? undefined : name(n.midi),
      }));
    music = lines(exercise.bars, per).map((line, i) => (
      <div key={i} className={classes.line} style={{ width: lineWidth(line.length, i, per) }}>
        <GrandStaff
          paper
          bars={line.map((b) => ({ rh: toStaff(b.rh), lh: toStaff(b.lh) }))}
          time={i === 0 ? exercise.time : undefined}
          height={195}
          label={t('sheet.lineLabel', { n: i + 1 })}
        />
      </div>
    ));
  } else {
    let previousTied = false;
    let flat = 0;
    const planned = songFingers(exercise);
    const bars: StaffNote[][] = exercise.bars.map((bar) =>
      bar.map((n) => {
        const finger = planned[flat++];
        // a tied note is held: its finger is not repeated
        const held = previousTied;
        previousTied = !!n.tie;
        return {
          midi: n.midi,
          duration: n.value,
          label: name(n.midi),
          finger: fingers && !held ? finger : undefined,
          tie: n.tie,
        };
      }),
    );
    music = lines(bars, per).map((line, i) => (
      <div key={i} className={classes.line} style={{ width: lineWidth(line.length, i, per) }}>
        <Staff
          paper
          clef={exercise.clef}
          keySignature={exercise.keySignature}
          time={i === 0 ? exercise.time : undefined}
          bars={line}
          height={names ? 150 : 135}
          scale={1.15}
          label={t('sheet.lineLabel', { n: i + 1 })}
        />
      </div>
    ));
  }
  const hasFingers = exercise.type !== 'piece' && songFingers(exercise).some((f) => f);

  return (
    <div className={classes.page} data-kids={kids || undefined}>
      {/* --------------------------------------------- only on the screen */}
      <Group className={classes.tools} justify="space-between" wrap="wrap" gap="sm">
        <Button
          component={Link}
          to={backTo}
          variant="subtle"
          leftSection={<IconArrowLeft size={18} />}
        >
          {t('sheet.back')}
        </Button>
        <Group gap="md" wrap="wrap">
          <Switch
            checked={names}
            onChange={(e) => setNames(e.currentTarget.checked)}
            label={t('sheet.names')}
            size="md"
          />
          {hasFingers && (
            <Switch
              checked={fingers}
              onChange={(e) => setFingers(e.currentTarget.checked)}
              label={t('sheet.fingers')}
              size="md"
            />
          )}
          <Button
            leftSection={<IconPrinter size={20} />}
            onClick={() => window.print()}
            data-testid="sheet-print"
          >
            {t('sheet.print')}
          </Button>
        </Group>
      </Group>

      {/* --------------------------------------------- the sheet */}
      <article className={classes.sheet} data-testid="sheet" aria-label={title}>
        <header className={classes.head}>
          <div className={classes.brand}>
            <img src="/logo.svg" alt="" width={34} height={34} />
            <span className={classes.wordmark}>Klavio</span>
          </div>
          {chip && (
            <span
              className={classes.world}
              style={{ '--world': `var(--mantine-color-${chip.color}-9)` } as React.CSSProperties}
            >
              {chip.text}
            </span>
          )}
        </header>
        <div className={classes.stripe} aria-hidden />

        <div className={classes.titleRow}>
          <div>
            <h1 className={classes.title}>{title}</h1>
            <p className={classes.meta}>
              {t('sheet.meta', { tempo: exercise.tempo, time: exercise.time })}
            </p>
          </div>
          {activeProfile && (
            <div className={classes.forWhom}>
              <ProfileAvatar
                avatar={activeProfile.avatar}
                outfit={activeProfile.outfit}
                size={52}
              />
              <span>{t('sheet.for', { name: activeProfile.name })}</span>
            </div>
          )}
        </div>

        <div className={classes.music}>{music}</div>

        <div className={classes.bottom}>
          <div className={classes.tip}>
            <img src="/logo.svg" alt="" width={28} height={28} className={classes.tipIcon} />
            <div>
              <p className={classes.tipTitle}>{t('sheet.tipTitle')}</p>
              <ol className={classes.tipList}>
                {(['hands', 'slow', 'faster'] as const).map((k) => (
                  <li key={k}>{t(`sheet.tips.${k}`)}</li>
                ))}
              </ol>
            </div>
          </div>
          <div className={classes.week}>
            <p className={classes.tipTitle}>{t('sheet.week')}</p>
            <ul className={classes.days}>
              {days.map((d) => (
                <li key={d}>
                  <span className={classes.box} aria-hidden>
                    {kids ? '☆' : ''}
                  </span>
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <footer className={classes.foot}>
          <Text component="span" size="xs">
            {t('sheet.footer', {
              date: new Date(`${localIsoDate()}T12:00:00`).toLocaleDateString(i18n.language),
            })}
          </Text>
          <Text component="span" size="xs">
            {note}
          </Text>
        </footer>
      </article>
    </div>
  );
}
