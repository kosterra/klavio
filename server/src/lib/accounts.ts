import type { Types } from 'mongoose';
import {
  DailyActivity,
  EmailCode,
  LessonProgress,
  LessonReceipt,
  PushReminder,
  Passkey,
  Profile,
  Session,
  User,
} from '../models/index.js';

/** Deletes an account with everything that belongs to it. */
export async function deleteAccount(userId: Types.ObjectId) {
  const profileIds = (await Profile.find({ userId }, { _id: 1 }).lean()).map((p) => p._id);
  await Promise.all([
    LessonProgress.deleteMany({ profileId: { $in: profileIds } }),
    DailyActivity.deleteMany({ profileId: { $in: profileIds } }),
    LessonReceipt.deleteMany({ profileId: { $in: profileIds } }),
    PushReminder.deleteMany({ userId }),
    Profile.deleteMany({ userId }),
    Passkey.deleteMany({ userId }),
    EmailCode.deleteMany({ userId }),
    Session.deleteMany({ userId }),
  ]);
  await User.deleteOne({ _id: userId });
}
