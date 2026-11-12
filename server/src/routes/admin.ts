import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
  CODE_MAILS,
  MAIL_TEMPLATE_IDS,
  adminSettingsSchema,
  mailLangSchema,
  mailTemplateSchema,
  type AdminSettingsDto,
  type MailTemplateDto,
} from '@klavio/shared';
import type { AppConfig } from '../config.js';
import { AppSettings } from '../models/index.js';
import { getSettings } from '../lib/settings.js';
import type { Mailer } from '../lib/mailer.js';
import {
  codeMail,
  templateMail,
  getMailTemplate,
  resetMailTemplate,
  saveMailTemplate,
} from '../lib/mailTemplates.js';

const templateParams = z.object({ id: z.enum(MAIL_TEMPLATE_IDS) });

/** Global settings, only for users with role "admin" (granted via `npm run admin:grant`). */
const adminRoutes: FastifyPluginAsyncZod<{ config: AppConfig; mailer: Mailer }> = async (
  app,
  { config, mailer },
) => {
  app.addHook('preHandler', app.requireAdmin);

  app.get('/settings', async (): Promise<AdminSettingsDto> => getSettings(config));

  app.put('/settings', { schema: { body: adminSettingsSchema } }, async (req) => {
    await getSettings(config); // ensure the singleton exists
    await AppSettings.updateOne({ _id: 'global' }, { $set: req.body });
    req.log.info(
      { admin: req.auth!.user._id, settings: Object.keys(req.body) },
      'settings changed',
    );
    return getSettings(config);
  });

  // ------------------------------------------------------- e-mail texts
  app.get('/mail-templates', async (): Promise<MailTemplateDto[]> =>
    Promise.all(MAIL_TEMPLATE_IDS.map(getMailTemplate)),
  );

  app.put(
    '/mail-templates/:id',
    { schema: { params: templateParams, body: mailTemplateSchema } },
    async (req): Promise<MailTemplateDto> => {
      await saveMailTemplate(req.params.id, req.body);
      req.log.info({ admin: req.auth!.user._id, template: req.params.id }, 'mail texts changed');
      return getMailTemplate(req.params.id);
    },
  );

  /** back to the built-in texts */
  app.delete(
    '/mail-templates/:id',
    { schema: { params: templateParams } },
    async (req): Promise<MailTemplateDto> => {
      await resetMailTemplate(req.params.id);
      return getMailTemplate(req.params.id);
    },
  );

  /** sends the saved mail with a sample code to the admin's own address */
  app.post(
    '/mail-templates/:id/test',
    {
      schema: { params: templateParams, body: z.object({ lang: mailLangSchema }) },
      config: { rateLimit: { max: 10, timeWindow: '10 minutes' } },
    },
    async (req, reply) => {
      const to = req.auth!.user.email;
      const id = req.params.id;
      await mailer.send(
        CODE_MAILS.includes(id)
          ? await codeMail(config, id, to, '123456', req.body.lang)
          : await templateMail(config, id, to, req.body.lang, {
              // the weekly report: a sample profile
              ...(id === 'weekly-report'
                ? {
                    week: req.body.lang === 'en' ? '2 November' : '2. November',
                    report: [
                      {
                        name: 'Lina',
                        lines:
                          req.body.lang === 'en'
                            ? ['25 minutes practised, on 3 days', 'Next: «D and E»']
                            : ['25 Minuten geübt, an 3 Tagen', 'Als Nächstes: «D und E»'],
                      },
                    ],
                  }
                : {}),
              months: (await getSettings(config)).inactiveDeleteMonths || 24,
              date: new Date(Date.now() + 30 * 864e5).toLocaleDateString(
                req.body.lang === 'en' ? 'en-GB' : 'de-CH',
                { day: 'numeric', month: 'long', year: 'numeric' },
              ),
            }),
      );
      return reply.code(204).send();
    },
  );
};

export default adminRoutes;
