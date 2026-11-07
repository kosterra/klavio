import type { AppConfig } from '../config.js';
import { AppSettings } from '../models/index.js';

export async function getSettings(config: AppConfig) {
  const doc = await AppSettings.findOneAndUpdate(
    { _id: 'global' },
    { $setOnInsert: { emailLoginEnabled: config.EMAIL_LOGIN_DEFAULT } },
    { upsert: true, returnDocument: 'after', lean: true },
  );
  return { emailLoginEnabled: doc!.emailLoginEnabled };
}
