import nodemailer from 'nodemailer';
import type { AppConfig } from '../config.js';

export interface Mail {
  to: string;
  subject: string;
  text: string;
  html?: string;
  /** pictures shown inside the HTML (referenced by `cid:`) */
  attachments?: { filename: string; content: Buffer; cid: string; contentType: string }[];
}

export interface Mailer {
  send(mail: Mail): Promise<void>;
}

/**
 * SMTP mailer; without SMTP_HOST mails are only logged (development).
 * The mails themselves come from lib/mailTemplates.ts.
 */
export function createMailer(config: AppConfig, log: (msg: string) => void): Mailer {
  if (!config.SMTP_HOST) {
    return {
      async send(mail) {
        log(`[mail disabled — no SMTP_HOST] to=${mail.to} subject="${mail.subject}"\n${mail.text}`);
      },
    };
  }
  const transport = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_SECURE,
    requireTLS: config.SMTP_REQUIRE_TLS,
    auth: config.SMTP_USER ? { user: config.SMTP_USER, pass: config.SMTP_PASS } : undefined,
  });
  return {
    async send(mail) {
      await transport.sendMail({ from: config.MAIL_FROM, ...mail });
    },
  };
}
