import type { FastifyBaseLogger } from 'fastify';
import { mailLangOf } from '@klavio/shared';
import type { AppConfig } from '../config.js';
import { DailyActivity, Profile, PushReminder, User } from '../models/index.js';
import { sendPush } from './webPush.js';

/** A reminder goes out within this long after its time (later it is skipped for the day). */
const WINDOW_MIN = 180;

const TEXT = {
  de: {
    title: (name: string) => `${name}, Zeit fürs Klavier!`,
    body: 'Ein paar Minuten reichen schon – Klavi wartet auf dich.',
  },
  en: {
    title: (name: string) => `${name}, time for the piano!`,
    body: 'A few minutes are enough – Klavi is waiting for you.',
  },
};

/** The local day, time and weekday of a moment in a time zone. */
export function localMoment(now: Date, tz: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'short',
      hourCycle: 'h23',
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  const weekday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(parts.weekday!) + 1;
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
    weekday,
  };
}

/**
 * Sends the reminders that are due: their time has come today (in the
 * learner's time zone), on one of their weekdays, and the profile has not
 * practised yet today. Each reminder once a day; a browser that dropped its
 * subscription is forgotten.
 */
export async function runReminders(
  config: AppConfig,
  log: FastifyBaseLogger,
  now = new Date(),
  send: typeof sendPush = sendPush,
): Promise<{ sent: number; skipped: number; removed: number }> {
  const keys =
    config.VAPID_PUBLIC_KEY && config.VAPID_PRIVATE_KEY
      ? { publicKey: config.VAPID_PUBLIC_KEY, privateKey: config.VAPID_PRIVATE_KEY }
      : null;
  const result = { sent: 0, skipped: 0, removed: 0 };
  if (!keys) return result;
  for (const r of await PushReminder.find().lean()) {
    const local = localMoment(now, r.tz);
    if (r.lastDate === local.date || !r.days.includes(local.weekday)) continue;
    const [h, m] = r.time.split(':').map(Number);
    const due = h! * 60 + m!;
    if (local.minutes < due) continue;
    // claim the day (also against a second server)
    const claimed = await PushReminder.updateOne(
      { _id: r._id, lastDate: r.lastDate },
      { $set: { lastDate: local.date } },
    );
    if (claimed.modifiedCount === 0) continue;
    if (local.minutes > due + WINDOW_MIN) {
      result.skipped++; // the server was away: no reminder hours late
      continue;
    }
    const practised = await DailyActivity.exists({
      profileId: r.profileId,
      date: local.date,
      seconds: { $gt: 0 },
    });
    if (practised) {
      result.skipped++;
      continue;
    }
    const [profile, user] = await Promise.all([
      Profile.findById(r.profileId, { name: 1 }).lean(),
      User.findById(r.userId, { locale: 1 }).lean(),
    ]);
    if (!profile || !user) {
      await PushReminder.deleteOne({ _id: r._id });
      result.removed++;
      continue;
    }
    const t = TEXT[mailLangOf(user.locale)];
    try {
      const outcome = await send(
        r,
        { title: t.title(profile.name), body: t.body, url: '/' },
        keys,
        config.APP_ORIGIN,
      );
      if (outcome === 'gone') {
        await PushReminder.deleteOne({ _id: r._id });
        result.removed++;
      } else if (outcome === 'sent') result.sent++;
    } catch (err) {
      log.warn({ err }, 'reminder push failed');
    }
  }
  return result;
}

/** Every minute: the reminders that are due. */
export function scheduleReminders(config: AppConfig, log: FastifyBaseLogger) {
  if (!config.VAPID_PUBLIC_KEY || !config.VAPID_PRIVATE_KEY) return () => undefined;
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      await runReminders(config, log);
    } catch (err) {
      log.error({ err }, 'reminders failed');
    } finally {
      running = false;
    }
  };
  const every = setInterval(() => void run(), 60_000);
  every.unref();
  return () => clearInterval(every);
}
