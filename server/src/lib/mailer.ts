import nodemailer from 'nodemailer';
import type { AppConfig } from '../config.js';

export interface Mail {
  to: string;
  subject: string;
  text: string;
  html?: string;
  /** which mail it is (the template id) – the only thing logged in production without SMTP */
  template?: string;
  /** pictures shown inside the HTML (referenced by `cid:`) */
  attachments?: { filename: string; content: Buffer; cid: string; contentType: string }[];
}

export interface Mailer {
  send(mail: Mail): Promise<void>;
}

/**
 * SMTP mailer; without SMTP_HOST mails are only logged (development – in
 * production without their content).
 * The mails themselves come from lib/mailTemplates.ts.
 */
export function createMailer(config: AppConfig, log: (msg: string) => void): Mailer {
  if (!config.SMTP_HOST) {
    return {
      async send(mail) {
        // development: the whole mail (with its code) in the log; in production
        // never – a code in a log file would be a way into the account, and
        // subjects carry codes too: only which mail it was
        log(
          config.NODE_ENV === 'production'
            ? `[mail not sent — no SMTP_HOST configured] template=${mail.template ?? 'other'}`
            : `[mail disabled — no SMTP_HOST] to=${mail.to} subject="${mail.subject}"\n${mail.text}`,
        );
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
    async send({ template: _template, ...mail }) {
      await transport.sendMail({ from: config.MAIL_FROM, ...mail });
    },
  };
}
