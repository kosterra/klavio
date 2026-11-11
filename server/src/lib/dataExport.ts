import type { Types } from 'mongoose';
import { APP_CONFIG } from '@klavio/shared';
import {
  AuthThrottle,
  DailyActivity,
  LessonProgress,
  LessonReceipt,
  OwnPiece,
  PushReminder,
  Passkey,
  Profile,
  Session,
  User,
} from '../models/index.js';
import { profileToDto } from '../routes/profiles.js';

/**
 * Everything stored about an account, readable and complete (revDSG / GDPR:
 * right of access and data portability). Secrets stay out: the PIN hash and
 * the passkeys' keys are useless outside Klavio and only say «set».
 */
export async function exportAccount(userId: Types.ObjectId) {
  const [user, passkeys, profiles, sessions, reminders, pieces] = await Promise.all([
    User.findById(userId).lean(),
    Passkey.find({ userId }).sort({ createdAt: 1 }).lean(),
    Profile.find({ userId }).sort({ createdAt: 1 }).lean(),
    Session.find({ userId }).sort({ expiresAt: 1 }).lean(),
    PushReminder.find({ userId }).sort({ createdAt: 1 }).lean(),
    OwnPiece.find({ userId }).sort({ createdAt: 1 }).lean(),
  ]);
  if (!user) return null;
  // failed attempts kept against this account (PIN) and its address (codes)
  const throttles = await AuthThrottle.find({
    _id: { $in: [`pin:${userId.toString()}`, `code:${user.email}`] },
  }).lean();
  const ids = profiles.map((p) => p._id);
  const [progress, days, receipts] = await Promise.all([
    LessonProgress.find({ profileId: { $in: ids } })
      .sort({ lessonId: 1 })
      .lean(),
    DailyActivity.find({ profileId: { $in: ids } })
      .sort({ date: 1 })
      .lean(),
    LessonReceipt.find({ profileId: { $in: ids } })
      .sort({ expiresAt: 1 })
      .lean(),
  ]);
  return {
    exportedAt: new Date().toISOString(),
    app: APP_CONFIG.name,
    account: {
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      locale: user.locale,
      parentPin: user.parentPinHash ? 'set' : 'not set',
      parentPasskeyUnlock: user.parentPasskeyUnlock,
      weeklyReport: user.weeklyReport ?? false,
      weeklyReportLastWeek: user.weeklyReportWeek ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastActiveAt: user.lastActiveAt,
      inactiveWarnedAt: user.inactiveWarnedAt ?? null,
    },
    // where the account is logged in (the tokens themselves are not stored, only their hash)
    sessions: sessions.map((x) => ({
      expiresAt: x.expiresAt,
      profileSelected: !!x.activeProfileId,
    })),
    // practice reminders per browser (the push address and keys stay out: they are the browser's)
    reminders: reminders.map((r) => ({
      profile: profiles.find((p) => p._id.equals(r.profileId))?.name ?? null,
      time: r.time,
      days: r.days,
      timeZone: r.tz,
      pushService: new URL(r.endpoint).hostname,
      lastDay: r.lastDate,
      createdAt: r.createdAt,
    })),
    // imported songs and pieces, with their notes
    ownPieces: pieces.map((p) => ({
      title: p.title,
      composer: p.composer ?? null,
      notes: p.exercise,
      createdAt: p.createdAt,
    })),
    failedAttempts: throttles.map((x) => ({
      kind: x._id.startsWith('pin:') ? 'parent PIN' : 'e-mail code',
      failures: x.failures,
      lastFailureAt: x.lastFailureAt,
    })),
    passkeys: passkeys.map((k) => ({
      name: k.name,
      deviceType: k.deviceType,
      backedUp: k.backedUp,
      transports: k.transports,
      createdAt: k.createdAt,
      lastUsedAt: k.lastUsedAt,
    })),
    profiles: profiles.map((p) => {
      return {
        ...profileToDto(p as never),
        createdAt: p.createdAt,
        lessons: progress
          .filter((l) => l.profileId.equals(p._id))
          .map((l) => ({
            lesson: l.lessonId,
            bestStars: l.bestStars,
            completions: l.completions,
            lastCompletedAt: l.lastCompletedAt,
            lastLocalDate: l.lastLocalDate ?? null,
            placed: l.placed ?? false,
            reviewStep: l.reviewBox,
            reviews: l.reviews,
          })),
        practiceDays: days
          .filter((d) => d.profileId.equals(p._id))
          .map((d) => ({ date: d.date, seconds: d.seconds, xp: d.xp })),
        // results received (so one sent twice counts once), with the answer given
        resultReceipts: receipts
          .filter((r) => r.profileId.equals(p._id))
          .map((r) => ({ id: r._id, answer: r.result, expiresAt: r.expiresAt })),
      };
    }),
  };
}
