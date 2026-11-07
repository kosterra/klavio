import nodemailer from 'nodemailer';
import { APP_CONFIG } from '@klavio/shared';
import type { AppConfig } from '../config.js';

export interface Mail {
  to: string;
  subject: string;
  text: string;
}

export interface Mailer {
  send(mail: Mail): Promise<void>;
}

/** SMTP mailer; without SMTP_HOST mails are only logged (development). */
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

export function loginCodeMail(to: string, code: string): Mail {
  return {
    to,
    subject: `${code} ist dein ${APP_CONFIG.name}-Code`,
    text: [
      `Hallo!`,
      ``,
      `Dein Anmeldecode für ${APP_CONFIG.name}: ${code}`,
      ``,
      `Der Code ist 10 Minuten gültig. Wenn du ihn nicht angefordert hast, kannst du diese E-Mail ignorieren.`,
    ].join('\n'),
  };
}

export function verifyEmailMail(to: string, code: string): Mail {
  return {
    to,
    subject: `${code} – E-Mail-Adresse bestätigen`,
    text: [
      `Hallo!`,
      ``,
      `Mit diesem Code bestätigst du deine E-Mail-Adresse bei ${APP_CONFIG.name}: ${code}`,
      ``,
      `Der Code ist 10 Minuten gültig.`,
    ].join('\n'),
  };
}
