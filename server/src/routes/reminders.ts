import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { reminderSchema, type ReminderDto } from '@klavio/shared';
import type { AppConfig } from '../config.js';
import { PushReminder } from '../models/index.js';
import { HttpError, badRequest } from '../lib/errors.js';
import { isPushEndpoint } from '../lib/webPush.js';

const endpointBody = z.object({ endpoint: z.string().url().max(1000) });

function validTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Practice reminders of this browser: it reminds the active profile. The
 * learner sets it up themself (like «Wo spielst du?»), no parent area needed.
 */
const reminderRoutes: FastifyPluginAsyncZod<{ config: AppConfig }> = async (app, { config }) => {
  app.addHook('preHandler', app.requireAuth);
  app.addHook('preHandler', async () => {
    if (!config.VAPID_PUBLIC_KEY || !config.VAPID_PRIVATE_KEY)
      throw new HttpError(404, 'REMINDERS_OFF');
  });

  /** what this browser reminds of (POST: the address is not put into a URL) */
  app.post(
    '/status',
    { schema: { body: endpointBody } },
    async (req): Promise<ReminderDto | null> => {
      const r = await PushReminder.findOne({
        endpoint: req.body.endpoint,
        userId: req.auth!.user._id,
      }).lean();
      return r ? { time: r.time, days: r.days, profileId: r.profileId.toString() } : null;
    },
  );

  app.put('/', { schema: { body: reminderSchema } }, async (req): Promise<ReminderDto> => {
    const profileId = req.auth!.activeProfileId;
    if (!profileId) throw new HttpError(409, 'NO_ACTIVE_PROFILE');
    const { subscription, time, days, tz } = req.body;
    if (!isPushEndpoint(subscription.endpoint)) throw badRequest('BAD_PUSH_ENDPOINT');
    if (!validTimeZone(tz)) throw badRequest('BAD_TIME_ZONE');
    // a browser belongs to one account: set up again, it moves to this one
    await PushReminder.updateOne(
      { endpoint: subscription.endpoint },
      {
        $set: {
          userId: req.auth!.user._id,
          profileId,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          time,
          days: [...new Set(days)].sort(),
          tz,
          lastDate: null,
        },
      },
      { upsert: true },
    );
    return { time, days, profileId: profileId.toString() };
  });

  app.post('/off', { schema: { body: endpointBody } }, async (req, reply) => {
    await PushReminder.deleteOne({ endpoint: req.body.endpoint, userId: req.auth!.user._id });
    return reply.code(204).send();
  });
};

export default reminderRoutes;
