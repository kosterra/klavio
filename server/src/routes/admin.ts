import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { adminSettingsSchema, type AdminSettingsDto } from '@klavio/shared';
import type { AppConfig } from '../config.js';
import { AppSettings } from '../models/index.js';
import { getSettings } from '../lib/settings.js';

/** Global settings, only for users with role "admin" (granted via `npm run admin:grant`). */
const adminRoutes: FastifyPluginAsyncZod<{ config: AppConfig }> = async (app, { config }) => {
  app.addHook('preHandler', app.requireAdmin);

  app.get('/settings', async (): Promise<AdminSettingsDto> => getSettings(config));

  app.put('/settings', { schema: { body: adminSettingsSchema } }, async (req) => {
    await getSettings(config); // ensure the singleton exists
    await AppSettings.updateOne(
      { _id: 'global' },
      { emailLoginEnabled: req.body.emailLoginEnabled },
    );
    req.log.info({ admin: req.auth!.user._id, settings: req.body }, 'global settings changed');
    return getSettings(config);
  });
};

export default adminRoutes;
