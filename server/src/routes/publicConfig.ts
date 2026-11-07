import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { APP_CONFIG, type PublicConfigResponse } from '@klavio/shared';
import type { AppConfig } from '../config.js';
import { getSettings } from '../lib/settings.js';

const publicConfigRoutes: FastifyPluginAsyncZod<{ config: AppConfig }> = async (
  app,
  { config },
) => {
  app.get('/config', async (): Promise<PublicConfigResponse> => {
    const settings = await getSettings(config);
    return { appName: APP_CONFIG.name, registrationOpen: settings.registrationOpen };
  });

  app.get('/health', async () => ({ ok: true }));
};

export default publicConfigRoutes;
