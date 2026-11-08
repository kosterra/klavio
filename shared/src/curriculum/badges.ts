import { CURRICULUM, LESSONS } from './curriculum.ts';
import type { Localized } from './types.ts';

/** Everything a badge rule may look at — computed on the server after a lesson. */
export interface BadgeStats {
  /** bestStars per completed lesson id */
  lessons: Record<string, number>;
  streak: number;
  todaySeconds: number;
  dailyGoalMinutes: number;
  /** reviews done while a lesson was due (all lessons together) */
  reviews: number;
  /** lessons repeated up to the monthly step of the schedule (remembered for good) */
  longTerm: number;
}

export interface BadgeDef {
  id: string;
  /** Icon key, mapped to an icon in the client. */
  icon:
    | 'star'
    | 'trophy'
    | 'music'
    | 'metronome'
    | 'flame'
    | 'target'
    | 'book'
    | 'sparkles'
    | 'repeat'
    | 'brain';
  title: Localized;
  /** How to earn it (shown while it is still open). */
  hint: Localized;
  earned: (s: BadgeStats) => boolean;
}

const kindDone = (s: BadgeStats, kind: string) =>
  LESSONS.some((l) => l.kind === kind && (s.lessons[l.id] ?? 0) > 0);
const totalStars = (s: BadgeStats) => Object.values(s.lessons).reduce((n, x) => n + x, 0);

/**
 * Badges are permanent: once earned they stay, nothing expires or counts down.
 * Ids are stable (stored per profile).
 */
export const BADGES: BadgeDef[] = [
  {
    id: 'first-lesson',
    icon: 'sparkles',
    title: { 'de-CH': 'Erste Lektion', en: 'First lesson' },
    hint: { 'de-CH': 'Schliesse deine erste Lektion ab.', en: 'Finish your first lesson.' },
    earned: (s) => Object.keys(s.lessons).length > 0,
  },
  {
    id: 'perfect',
    icon: 'star',
    title: { 'de-CH': 'Perfekt!', en: 'Perfect!' },
    hint: {
      'de-CH': 'Hol dir in einer Lektion alle drei Sterne.',
      en: 'Get all three stars in a lesson.',
    },
    earned: (s) => Object.values(s.lessons).some((x) => x >= 3),
  },
  {
    id: 'first-song',
    icon: 'music',
    title: { 'de-CH': 'Erstes Lied', en: 'First song' },
    hint: {
      'de-CH': 'Spiel dein erstes Lied bis zum Schluss.',
      en: 'Play your first song to the end.',
    },
    earned: (s) => kindDone(s, 'song'),
  },
  {
    id: 'first-rhythm',
    icon: 'metronome',
    title: { 'de-CH': 'Im Takt', en: 'In time' },
    hint: { 'de-CH': 'Schliesse eine Rhythmus-Lektion ab.', en: 'Finish a rhythm lesson.' },
    earned: (s) => kindDone(s, 'rhythm'),
  },
  {
    id: 'reader',
    icon: 'book',
    title: { 'de-CH': 'Notenleser', en: 'Note reader' },
    hint: {
      'de-CH': 'Schliesse eine Lektion zum Notenlesen ab.',
      en: 'Finish a note-reading lesson.',
    },
    earned: (s) => kindDone(s, 'read'),
  },
  ...CURRICULUM.map((c, i): BadgeDef => ({
    id: `chapter-${c.id}`,
    icon: 'trophy',
    title: {
      'de-CH': `Kapitel ${i + 1} geschafft`,
      en: `Chapter ${i + 1} done`,
    },
    hint: {
      'de-CH': `Schliesse alle Lektionen von «${c.title['de-CH']}» ab.`,
      en: `Finish all lessons of “${c.title.en}”.`,
    },
    earned: (s) => c.lessons.every((l) => l.bonus || (s.lessons[l.id] ?? 0) > 0),
  })),
  {
    id: 'streak-3',
    icon: 'flame',
    title: { 'de-CH': '3 Tage in Folge', en: '3 days in a row' },
    hint: { 'de-CH': 'Übe an drei Tagen hintereinander.', en: 'Practise on three days in a row.' },
    earned: (s) => s.streak >= 3,
  },
  {
    id: 'streak-7',
    icon: 'flame',
    title: { 'de-CH': 'Eine ganze Woche', en: 'A whole week' },
    hint: {
      'de-CH': 'Übe an sieben Tagen hintereinander.',
      en: 'Practise on seven days in a row.',
    },
    earned: (s) => s.streak >= 7,
  },
  {
    id: 'daily-goal',
    icon: 'target',
    title: { 'de-CH': 'Tagesziel erreicht', en: 'Daily goal reached' },
    hint: {
      'de-CH': 'Übe an einem Tag so lange wie dein Tagesziel.',
      en: 'Practise as long as your daily goal in one day.',
    },
    earned: (s) => s.todaySeconds >= s.dailyGoalMinutes * 60,
  },
  {
    id: 'stars-30',
    icon: 'star',
    title: { 'de-CH': '30 Sterne', en: '30 stars' },
    hint: { 'de-CH': 'Sammle insgesamt 30 Sterne.', en: 'Collect 30 stars in total.' },
    earned: (s) => totalStars(s) >= 30,
  },
  // repetition: a whole series, so diligent reviewing keeps paying off
  {
    id: 'review-first',
    icon: 'repeat',
    title: { 'de-CH': 'Gut erinnert', en: 'Well remembered' },
    hint: {
      'de-CH': 'Wiederhole eine Lektion, wenn sie fällig ist.',
      en: 'Review a lesson when it is due.',
    },
    earned: (s) => s.reviews >= 1,
  },
  {
    id: 'memory-pro',
    icon: 'repeat',
    title: { 'de-CH': 'Gedächtnis-Profi', en: 'Memory pro' },
    hint: {
      'de-CH': 'Wiederhole zehnmal eine Lektion, wenn sie fällig ist.',
      en: 'Review a lesson ten times when it is due.',
    },
    earned: (s) => s.reviews >= 10,
  },
  {
    id: 'review-25',
    icon: 'repeat',
    title: { 'de-CH': 'Fleissig wiederholt', en: 'Diligent reviewer' },
    hint: {
      'de-CH': 'Wiederhole 25-mal eine fällige Lektion.',
      en: 'Review due lessons 25 times.',
    },
    earned: (s) => s.reviews >= 25,
  },
  {
    id: 'review-50',
    icon: 'brain',
    title: { 'de-CH': 'Elefanten-Gedächtnis', en: 'Memory like an elephant' },
    hint: {
      'de-CH': 'Wiederhole 50-mal eine fällige Lektion.',
      en: 'Review due lessons 50 times.',
    },
    earned: (s) => s.reviews >= 50,
  },
  {
    id: 'long-term',
    icon: 'brain',
    title: { 'de-CH': 'Für immer gemerkt', en: 'Remembered for good' },
    hint: {
      'de-CH': 'Wiederhole eine Lektion so lange, bis sie nur noch einmal im Monat fällig ist.',
      en: 'Keep reviewing a lesson until it is only due once a month.',
    },
    earned: (s) => s.longTerm >= 1,
  },
  {
    id: 'long-term-10',
    icon: 'brain',
    title: { 'de-CH': 'Schatzkammer im Kopf', en: 'Treasure chest in your head' },
    hint: {
      'de-CH': 'Bring zehn Lektionen bis zum Monats-Takt.',
      en: 'Bring ten lessons to the monthly step.',
    },
    earned: (s) => s.longTerm >= 10,
  },
];

/** Badges newly earned with these stats (not in `already`). */
export function newlyEarnedBadges(stats: BadgeStats, already: ReadonlySet<string>): string[] {
  return BADGES.filter((b) => !already.has(b.id) && b.earned(stats)).map((b) => b.id);
}

export function findBadge(id: string): BadgeDef | undefined {
  return BADGES.find((b) => b.id === id);
}
