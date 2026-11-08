import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_MAIL_TEMPLATES,
  MAIL_IMAGES,
  renderMail,
  type MailLang,
  type MailTemplateDto,
  type MailTemplateId,
  type MailTemplateTexts,
} from '@klavio/shared';
import type { AppConfig } from '../config.js';
import { MailTemplate } from '../models/index.js';
import type { Mail } from './mailer.js';

/** The texts of a mail: what an admin saved, otherwise the built-in ones. */
export async function getMailTemplate(id: MailTemplateId): Promise<MailTemplateDto> {
  const doc = await MailTemplate.findById(id).lean();
  if (!doc) return { id, texts: DEFAULT_MAIL_TEMPLATES[id], customized: false };
  const pick = (lang: MailLang) => ({
    subject: doc[lang].subject,
    heading: doc[lang].heading,
    intro: doc[lang].intro ?? '',
    outro: doc[lang].outro ?? '',
  });
  return { id, texts: { de: pick('de'), en: pick('en') }, customized: true };
}

export async function saveMailTemplate(id: MailTemplateId, texts: MailTemplateTexts) {
  await MailTemplate.updateOne({ _id: id }, { $set: texts }, { upsert: true });
}

export async function resetMailTemplate(id: MailTemplateId) {
  await MailTemplate.deleteOne({ _id: id });
}

type Attachment = NonNullable<Mail['attachments']>[number];
let images: Promise<Attachment[] | null> | null = null;

/**
 * Logo and Klavi, from the built client (STATIC_DIR) or, in development, from
 * client/public. Read once; without them the mail simply has no pictures.
 */
function mailImages(config: AppConfig): Promise<Attachment[] | null> {
  images ??= (async () => {
    const dir = config.STATIC_DIR
      ? join(config.STATIC_DIR, 'mail')
      : fileURLToPath(new URL('../../../client/public/mail/', import.meta.url));
    try {
      return await Promise.all(
        Object.values(MAIL_IMAGES).map(async ({ file, cid }) => ({
          filename: file,
          content: await readFile(join(dir, file)),
          cid,
          contentType: 'image/png',
        })),
      );
    } catch {
      return null;
    }
  })();
  return images;
}

/** A code mail, in the design of Klavio and the language of the app. */
export async function codeMail(
  config: AppConfig,
  id: MailTemplateId,
  to: string,
  code: string,
  lang: MailLang = 'de',
): Promise<Mail> {
  const { texts } = await getMailTemplate(id);
  const attachments = await mailImages(config);
  const { subject, text, html } = renderMail(texts[lang], lang, {
    code,
    origin: config.APP_ORIGIN,
    images: attachments
      ? { logo: `cid:${MAIL_IMAGES.logo.cid}`, klavi: `cid:${MAIL_IMAGES.klavi.cid}` }
      : undefined,
  });
  return { to, subject, text, html, ...(attachments ? { attachments } : {}) };
}
