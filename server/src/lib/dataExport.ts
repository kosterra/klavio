import type { Types } from 'mongoose';
import { APP_CONFIG } from '@klavio/shared';
import { DailyActivity, LessonProgress, Passkey, Profile, User } from '../models/index.js';
import { profileToDto } from '../routes/profiles.js';

/**
 * Everything stored about an account, readable and complete (revDSG / GDPR:
 * right of access and data portability). Secrets stay out: the PIN hash and
 * the passkeys' keys are useless outside Klavio and only say «set».
 */
export async function exportAccount(userId: Types.ObjectId) {
  const [user, passkeys, profiles] = await Promise.all([
    User.findById(userId).lean(),
    Passkey.find({ userId }).sort({ createdAt: 1 }).lean(),
    Profile.find({ userId }).sort({ createdAt: 1 }).lean(),
  ]);
  if (!user) return null;
  const ids = profiles.map((p) => p._id);
  const [progress, days] = await Promise.all([
    LessonProgress.find({ profileId: { $in: ids } })
      .sort({ lessonId: 1 })
      .lean(),
    DailyActivity.find({ profileId: { $in: ids } })
      .sort({ date: 1 })
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
      createdAt: user.createdAt,
      lastActiveAt: user.lastActiveAt,
    },
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
            reviewStep: l.reviewBox,
            reviews: l.reviews,
          })),
        practiceDays: days
          .filter((d) => d.profileId.equals(p._id))
          .map((d) => ({ date: d.date, seconds: d.seconds, xp: d.xp })),
      };
    }),
  };
}
