import type { FastifyBaseLogger } from 'fastify';
import {
  CORE_LESSONS,
  addDays,
  effectiveWorld,
  findLesson,
  lessonFor,
  liveStreak,
  mailLangOf,
  nextLesson,
  weekOf,
  type MailLang,
} from '@klavio/shared';
import type { AppConfig } from '../config.js';
import { DailyActivity, LessonProgress, Profile, User } from '../models/index.js';
import type { Mailer } from './mailer.js';
import { templateMail } from './mailTemplates.js';
import { getSettings } from './settings.js';

/** Monday morning (UTC) the week before is reported – once per account. */
const SEND_FROM_HOUR = 6;

const LINES: Record<
  MailLang,
  {
    minutes: (m: number, d: number) => string;
    none: string;
    lessons: (n: number) => string;
    streak: (n: number) => string;
    next: (t: string) => string;
    allDone: string;
  }
> = {
  de: {
    minutes: (m, d) =>
      `${m} ${m === 1 ? 'Minute' : 'Minuten'} geübt, an ${d} ${d === 1 ? 'Tag' : 'Tagen'}`,
    none: 'Diese Woche wurde nicht geübt – nächste Woche ist eine neue Chance.',
    lessons: (n) => `${n} ${n === 1 ? 'Lektion' : 'Lektionen'} gespielt`,
    streak: (n) => `${n} ${n === 1 ? 'Tag' : 'Tage'} in Folge`,
    next: (t) => `Als Nächstes: «${t}»`,
    allDone: 'Alle Kapitel geschafft!',
  },
  en: {
    minutes: (m, d) =>
      `${m} ${m === 1 ? 'minute' : 'minutes'} practised, on ${d} ${d === 1 ? 'day' : 'days'}`,
    none: 'No practice this week – next week is a new chance.',
    lessons: (n) => `${n} ${n === 1 ? 'lesson' : 'lessons'} played`,
    streak: (n) => `${n} ${n === 1 ? 'day' : 'days'} in a row`,
    next: (t) => `Next: «${t}»`,
    allDone: 'All chapters done!',
  },
};

/**
 * Sends the weekly report to every account that switched it on: per profile
 * the minutes and days of the past week (Monday to Sunday), the lessons
 * played, the days in a row and the next lesson. Each week only once – the
 * week is marked before sending, so two servers do not both send it.
 */
export async function runWeeklyReports(
  config: AppConfig,
  mailer: Mailer,
  log: FastifyBaseLogger,
  now = new Date(),
): Promise<{ sent: number }> {
  const today = now.toISOString().slice(0, 10);
  const thisWeek = weekOf(today);
  // Monday before 6 o'clock: wait (the week has only just ended)
  if (today === thisWeek && now.getUTCHours() < SEND_FROM_HOUR) return { sent: 0 };
  const week = addDays(thisWeek, -7);
  const sunday = addDays(week, 6);
  const { journeyMinAge } = await getSettings(config);
  let sent = 0;

  const users = await User.find(
    { weeklyReport: true, email: { $ne: null }, weeklyReportWeek: { $ne: week } },
    { email: 1, locale: 1 },
  ).lean();
  for (const user of users) {
    // claim this week for this account (also against a second server)
    const claimed = await User.updateOne(
      { _id: user._id, weeklyReportWeek: { $ne: week } },
      { $set: { weeklyReportWeek: week } },
    );
    if (claimed.modifiedCount === 0) continue;
    const lang = mailLangOf(user.locale);
    const t = LINES[lang];
    const profiles = await Profile.find({ userId: user._id }).sort({ createdAt: 1 }).lean();
    if (!profiles.length) continue;
    const ids = profiles.map((p) => p._id);
    const [days, progress] = await Promise.all([
      DailyActivity.find({ profileId: { $in: ids }, date: { $gte: week, $lte: sunday } }).lean(),
      LessonProgress.find({ profileId: { $in: ids }, bestStars: { $gt: 0 } }).lean(),
    ]);
    const from = new Date(`${week}T00:00:00Z`).getTime() - 14 * 3600_000;
    const to = new Date(`${sunday}T23:59:59Z`).getTime() + 14 * 3600_000;
    const report = profiles.map((p) => {
      const mine = days.filter((d) => d.profileId.equals(p._id) && (d.seconds ?? 0) > 0);
      const minutes = Math.round(mine.reduce((n, d) => n + (d.seconds ?? 0), 0) / 60);
      const done = progress.filter((l) => l.profileId.equals(p._id));
      // lessons played that week: last played on a day of it
      const played = done.filter(
        (l) =>
          (l.lastLocalDate && l.lastLocalDate >= week && l.lastLocalDate <= sunday) ||
          (!l.lastLocalDate &&
            l.lastCompletedAt &&
            l.lastCompletedAt.getTime() >= from &&
            l.lastCompletedAt.getTime() <= to),
      ).length;
      const completed = new Set(done.map((l) => l.lessonId));
      const allDone = CORE_LESSONS.every((l) => completed.has(l.id));
      const next = nextLesson(completed);
      const world = effectiveWorld(p as never, journeyMinAge);
      const base = findLesson(next.id);
      const title = base ? lessonFor(base, world).title[lang === 'de' ? 'de-CH' : 'en'] : next.id;
      const streak = liveStreak(
        {
          current: p.streak?.current ?? 0,
          longest: p.streak?.longest ?? 0,
          lastActiveDate: p.streak?.lastActiveDate ?? null,
          freeDayWeek: p.streak?.freeDayWeek ?? null,
        },
        today,
      );
      const lines = [
        minutes > 0 ? t.minutes(minutes, mine.length) : t.none,
        ...(played > 0 ? [t.lessons(played)] : []),
        ...(streak > 1 ? [t.streak(streak)] : []),
        allDone ? t.allDone : t.next(title),
      ];
      return { name: p.name, lines };
    });
    const weekText = new Date(`${week}T12:00:00Z`).toLocaleDateString(
      lang === 'en' ? 'en-GB' : 'de-CH',
      { day: 'numeric', month: 'long' },
    );
    try {
      await mailer.send(
        await templateMail(config, 'weekly-report', user.email!, lang, { week: weekText, report }),
      );
      sent++;
    } catch (err) {
      log.error({ err }, 'weekly report mail failed');
      // not sent: try again next round
      await User.updateOne({ _id: user._id }, { $set: { weeklyReportWeek: null } });
    }
  }
  if (sent) log.info({ sent, week }, 'weekly reports sent');
  return { sent };
}

/** Every hour: Monday morning the reports go out (and later, should the server have been down). */
export function scheduleWeeklyReports(config: AppConfig, mailer: Mailer, log: FastifyBaseLogger) {
  const run = () =>
    runWeeklyReports(config, mailer, log).catch((err) =>
      log.error({ err }, 'weekly reports failed'),
    );
  const first = setTimeout(run, 90_000);
  const every = setInterval(run, 60 * 60 * 1000);
  first.unref();
  every.unref();
  return () => {
    clearTimeout(first);
    clearInterval(every);
  };
}
