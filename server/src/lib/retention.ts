import type { FastifyBaseLogger } from 'fastify';
import { mailLangOf } from '@klavio/shared';
import type { AppConfig } from '../config.js';
import { User } from '../models/index.js';
import { deleteAccount } from './accounts.js';
import type { Mailer } from './mailer.js';
import { templateMail } from './mailTemplates.js';
import { getSettings } from './settings.js';

/** How long the warning is ahead of the deletion. */
export const WARNING_DAYS = 30;
const DAY = 24 * 60 * 60 * 1000;

/**
 * Deletes accounts nobody used for the months admins set (0 = never): first a
 * warning e-mail, then – if the account is still not used – the account with
 * everything in it, WARNING_DAYS later. Signing in once keeps it.
 */
export async function runRetention(
  config: AppConfig,
  mailer: Mailer,
  log: FastifyBaseLogger,
  now = new Date(),
) {
  const { inactiveDeleteMonths: months } = await getSettings(config);
  if (!months) return { warned: 0, deleted: 0 };
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - months);
  const unused = {
    $or: [{ lastActiveAt: { $lt: cutoff } }, { lastActiveAt: null, createdAt: { $lt: cutoff } }],
  };

  let deleted = 0;
  const due = await User.find({
    ...unused,
    inactiveWarnedAt: { $ne: null, $lt: new Date(now.getTime() - WARNING_DAYS * DAY) },
  }).lean();
  for (const user of due) {
    await deleteAccount(user._id);
    deleted++;
  }

  let warned = 0;
  const toWarn = await User.find({ ...unused, inactiveWarnedAt: null }).lean();
  for (const user of toWarn) {
    const lang = mailLangOf(user.locale);
    const date = new Date(now.getTime() + WARNING_DAYS * DAY).toLocaleDateString(
      lang === 'en' ? 'en-GB' : 'de-CH',
      { day: 'numeric', month: 'long', year: 'numeric' },
    );
    try {
      await mailer.send(
        await templateMail(config, 'inactive-warning', user.email, lang, { months, date }),
      );
      await User.updateOne({ _id: user._id }, { inactiveWarnedAt: now });
      warned++;
    } catch (err) {
      // no warning sent → no deletion; try again next time
      log.warn({ err, user: user._id }, 'inactivity warning not sent');
    }
  }
  if (warned || deleted) log.info({ warned, deleted, months }, 'inactive accounts');
  return { warned, deleted };
}

/** Runs the retention every six hours (and shortly after the start). */
export function scheduleRetention(config: AppConfig, mailer: Mailer, log: FastifyBaseLogger) {
  const run = () =>
    runRetention(config, mailer, log).catch((err) => log.error({ err }, 'retention failed'));
  const first = setTimeout(run, 60_000);
  const every = setInterval(run, 6 * 60 * 60 * 1000);
  first.unref();
  every.unref();
  return () => {
    clearTimeout(first);
    clearInterval(every);
  };
}
