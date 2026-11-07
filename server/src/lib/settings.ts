import type { AppConfig } from '../config.js';
import { AppSettings } from '../models/index.js';

export async function getSettings(config: AppConfig) {
  const doc = await AppSettings.findOneAndUpdate(
    { _id: 'global' },
    { $setOnInsert: { registrationOpen: config.REGISTRATION_OPEN_DEFAULT } },
    { upsert: true, returnDocument: 'after', lean: true },
  );
  // Documents from before the switch was renamed have no `registrationOpen` yet.
  return { registrationOpen: doc!.registrationOpen ?? config.REGISTRATION_OPEN_DEFAULT };
}
