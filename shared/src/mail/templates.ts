import { z } from 'zod';
import { APP_CONFIG } from '../config/app.ts';

/**
 * The e-mails Klavio sends, with texts admins can change in both languages.
 * The layout (colours, logo, the big code box, the footer) is fixed; admins
 * edit the words around it. The same renderer runs on the server (sending)
 * and in the admin page (preview), so what one sees is what goes out.
 */
export const MAIL_TEMPLATE_IDS = [
  'login-code',
  'verify-email',
  'pin-reset',
  'inactive-warning',
  'weekly-report',
] as const;

/** Mails that carry a sign-in code (the others have a button instead). */
export const CODE_MAILS: readonly MailTemplateId[] = ['login-code', 'verify-email', 'pin-reset'];
export type MailTemplateId = (typeof MAIL_TEMPLATE_IDS)[number];

export const MAIL_LANGS = ['de', 'en'] as const;
export type MailLang = (typeof MAIL_LANGS)[number];
export const mailLangSchema = z.enum(MAIL_LANGS);

/** The language of the UI (de-CH, en, …) → the language of a mail. */
export function mailLangOf(locale: string | undefined | null): MailLang {
  return locale?.toLowerCase().startsWith('en') ? 'en' : 'de';
}

/** Placeholders admins can use in every field. */
export const MAIL_PLACEHOLDERS = ['code', 'app', 'minutes', 'months', 'date', 'week'] as const;

export const mailTextSchema = z.object({
  subject: z.string().trim().min(1).max(160),
  heading: z.string().trim().min(1).max(160),
  intro: z.string().trim().max(2000),
  outro: z.string().trim().max(2000),
});
export type MailText = z.infer<typeof mailTextSchema>;

export const mailTemplateSchema = z.object({ de: mailTextSchema, en: mailTextSchema });
export type MailTemplateTexts = z.infer<typeof mailTemplateSchema>;

export interface MailTemplateDto {
  id: MailTemplateId;
  texts: MailTemplateTexts;
  /** false while the built-in texts are used */
  customized: boolean;
}

export const DEFAULT_MAIL_TEMPLATES: Record<MailTemplateId, MailTemplateTexts> = {
  'login-code': {
    de: {
      subject: '{{code}} ist dein {{app}}-Code',
      heading: 'Dein Code für {{app}}',
      intro: 'Hallo!\n\nGib diesen Code in {{app}} ein, um dich anzumelden:',
      outro:
        'Der Code ist {{minutes}} Minuten gültig. Wenn du ihn nicht angefordert hast, kannst du diese E-Mail einfach ignorieren.\n\nViel Freude am Klavier!',
    },
    en: {
      subject: '{{code}} is your {{app}} code',
      heading: 'Your {{app}} code',
      intro: 'Hello!\n\nEnter this code in {{app}} to sign in:',
      outro:
        'The code is valid for {{minutes}} minutes. If you did not ask for it, you can simply ignore this e-mail.\n\nEnjoy the piano!',
    },
  },
  'verify-email': {
    de: {
      subject: '{{code}} – E-Mail-Adresse bestätigen',
      heading: 'Neue E-Mail-Adresse bestätigen',
      intro: 'Hallo!\n\nMit diesem Code bestätigst du deine neue E-Mail-Adresse bei {{app}}:',
      outro:
        'Der Code ist {{minutes}} Minuten gültig. Wenn du deine Adresse nicht ändern wolltest, ignoriere diese E-Mail – es bleibt alles, wie es ist.',
    },
    en: {
      subject: '{{code}} – confirm your e-mail address',
      heading: 'Confirm your new e-mail address',
      intro: 'Hello!\n\nUse this code to confirm your new e-mail address at {{app}}:',
      outro:
        'The code is valid for {{minutes}} minutes. If you did not want to change your address, ignore this e-mail – nothing changes.',
    },
  },
  'pin-reset': {
    de: {
      subject: '{{code}} – Eltern-PIN zurücksetzen',
      heading: 'Eltern-PIN vergessen?',
      intro:
        'Hallo!\n\nMit diesem Code entfernst du die Eltern-PIN deines {{app}}-Kontos. Danach kannst du eine neue festlegen:',
      outro:
        'Der Code ist {{minutes}} Minuten gültig. Wenn du das nicht warst, ignoriere diese E-Mail – die PIN bleibt, wie sie ist.',
    },
    en: {
      subject: '{{code}} – reset the parent PIN',
      heading: 'Forgot the parent PIN?',
      intro:
        'Hello!\n\nUse this code to remove the parent PIN of your {{app}} account. Afterwards you can set a new one:',
      outro:
        'The code is valid for {{minutes}} minutes. If this was not you, ignore this e-mail – the PIN stays as it is.',
    },
  },
  'inactive-warning': {
    de: {
      subject: 'Dein {{app}}-Konto wird bald gelöscht',
      heading: 'Wir vermissen dich!',
      intro:
        'Hallo!\n\nDu hast dich seit {{months}} Monaten nicht mehr bei {{app}} angemeldet. Damit keine Daten unnötig liegen bleiben, löschen wir dein Konto mit allen Profilen und dem Lernfortschritt am {{date}}.',
      outro:
        'Willst du dein Konto behalten? Melde dich einfach vorher einmal an – dann bleibt alles, wie es ist.',
    },
    en: {
      subject: 'Your {{app}} account will be deleted soon',
      heading: 'We miss you!',
      intro:
        'Hello!\n\nYou have not signed in to {{app}} for {{months}} months. So that no data is kept for nothing, we will delete your account with all profiles and learning progress on {{date}}.',
      outro:
        'Want to keep your account? Just sign in once before then – and everything stays as it is.',
    },
  },
  'weekly-report': {
    de: {
      subject: 'Die Klavier-Woche bei {{app}} ({{week}})',
      heading: 'So war die Klavier-Woche',
      intro: 'Hallo!\n\nHier ist, was in der Woche vom {{week}} geübt wurde:',
      outro:
        'Kleine Schritte zählen: Ein paar Minuten an mehreren Tagen bringen mehr als eine lange Stunde.\n\nDiesen Wochenbericht kannst du in {{app}} unter «Konto» jederzeit abbestellen.',
    },
    en: {
      subject: 'The piano week at {{app}} ({{week}})',
      heading: 'This was the piano week',
      intro: 'Hello!\n\nHere is what was practised in the week of {{week}}:',
      outro:
        'Small steps count: a few minutes on several days do more than one long hour.\n\nYou can stop this weekly report at any time in {{app}} under «Account».',
    },
  },
};

export interface MailVars {
  /** the sign-in code – mails without one get a button to the instance instead */
  code?: string;
  minutes?: number;
  /** inactivity warning: months without sign-in and the date of deletion */
  months?: number;
  date?: string;
  /** weekly report: the week («2. November») and a block per profile */
  week?: string;
  report?: { name: string; lines: string[] }[];
  /** the public address of the instance, shown in the footer */
  origin?: string;
  /**
   * Where the pictures come from: `cid:` references to attachments when sent
   * (they show even when the server is behind a login), plain URLs in the preview.
   */
  images?: { logo: string; klavi: string };
}

/** The pictures of a mail, sent along as inline attachments (client/public/mail). */
export const MAIL_IMAGES = {
  logo: { file: 'logo.png', cid: 'klavio-logo@klavio' },
  klavi: { file: 'klavi.png', cid: 'klavi@klavio' },
} as const;

export interface RenderedMail {
  subject: string;
  text: string;
  /** the complete HTML document that is sent */
  html: string;
  /** only the visible card, for the preview inside the app */
  bodyHtml: string;
}

function fill(template: string, vars: MailVars): string {
  const values: Record<string, string> = {
    code: vars.code ?? '',
    app: APP_CONFIG.name,
    minutes: String(vars.minutes ?? 10),
    months: String(vars.months ?? ''),
    date: vars.date ?? '',
    week: vars.week ?? '',
  };
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) => values[key] ?? match);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Blank lines separate paragraphs, single line breaks stay line breaks. */
function paragraphs(text: string, style: string): string {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="${style}">${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

const FOOTER: Record<MailLang, string> = {
  de: 'Du bekommst diese E-Mail, weil diese Adresse bei {{app}} eingegeben wurde. {{app}} – spielerisch Klavier lernen, am echten Klavier.',
  en: 'You get this e-mail because this address was entered at {{app}}. {{app}} – learn the piano playfully, on a real piano.',
};

const OPEN: Record<MailLang, string> = {
  de: `${APP_CONFIG.name} öffnen`,
  en: `Open ${APP_CONFIG.name}`,
};

// Klavio's colours (Mantine indigo / grape / orange / yellow), written out:
// mail clients know no CSS variables.
const INDIGO = '#3b5bdb';
const INDIGO_DARK = '#364fc7';
const GRAPE = '#ae3ec9';
const ORANGE = '#e8590c';
const INK = '#1f2440';
const MUTED = '#5c6178';
const PAGE = '#fff6ea';
const FONT = "'Nunito', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** Renders a mail in Klavio's design: header, heading, text, the code box and the footer. */
export function renderMail(texts: MailText, lang: MailLang, vars: MailVars): RenderedMail {
  const subject = fill(texts.subject, vars);
  const heading = fill(texts.heading, vars);
  const intro = fill(texts.intro, vars);
  const outro = fill(texts.outro, vars);
  const footer = fill(FOOTER[lang], vars);
  const p = `margin:0 0 14px;font-family:${FONT};font-size:17px;line-height:1.55;color:${INK}`;

  const bodyHtml = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;border-collapse:separate;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 6px 24px rgba(59,91,219,0.12)">
<tr><td style="background-color:${INDIGO};background-image:linear-gradient(135deg,${INDIGO} 0%,${GRAPE} 65%,${ORANGE} 100%);padding:22px 28px">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
${
  vars.images
    ? `<td style="padding-right:12px;vertical-align:middle"><img src="${escapeHtml(vars.images.logo)}" width="44" height="44" alt="" style="display:block;border:2px solid #ffffff;border-radius:12px"></td>`
    : ''
}
<td style="vertical-align:middle;font-family:${FONT};font-size:24px;font-weight:900;color:#ffffff;letter-spacing:0.5px">${escapeHtml(APP_CONFIG.name)}</td>
</tr></table>
</td></tr>
<tr><td style="padding:24px 28px 8px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px"><tr>
${
  vars.images
    ? `<td width="84" style="width:84px;padding-right:14px;vertical-align:middle"><img src="${escapeHtml(vars.images.klavi)}" width="84" height="98" alt="Klavi" style="display:block;border:0"></td>`
    : ''
}
<td style="vertical-align:middle"><h1 style="margin:0;font-family:${FONT};font-size:24px;line-height:1.25;font-weight:800;color:${INK}">${escapeHtml(heading)}</h1></td>
</tr></table>
${paragraphs(intro, p)}
</td></tr>
${
  vars.report?.length
    ? `<tr><td style="padding:0 28px 10px">${vars.report
        .map(
          (
            r,
          ) => `<div style="margin:0 0 12px;padding:14px 16px;border-radius:14px;background:#edf2ff;border-left:5px solid ${INDIGO}">
<p style="margin:0 0 6px;font-family:${FONT};font-size:18px;font-weight:800;color:${INK}">${escapeHtml(r.name)}</p>
${r.lines.map((l) => `<p style="margin:0 0 3px;font-family:${FONT};font-size:15px;line-height:1.45;color:${INK}">${escapeHtml(l)}</p>`).join('')}
</div>`,
        )
        .join('')}</td></tr>`
    : ''
}
${
  vars.code
    ? `<tr><td align="center" style="padding:6px 28px 22px">
<div style="display:inline-block;padding:14px 14px 14px 22px;border-radius:16px;background:#edf2ff;border:2px dashed ${INDIGO};font-family:'SF Mono',Menlo,Consolas,monospace;font-size:34px;font-weight:800;letter-spacing:8px;white-space:nowrap;color:${INDIGO_DARK}">${escapeHtml(vars.code)}</div>
</td></tr>`
    : vars.origin
      ? `<tr><td align="center" style="padding:6px 28px 22px">
<a href="${escapeHtml(vars.origin)}" style="display:inline-block;padding:14px 28px;border-radius:12px;background:${INDIGO};color:#ffffff;font-family:${FONT};font-size:18px;font-weight:800;text-decoration:none">${escapeHtml(OPEN[lang])}</a>
</td></tr>`
      : ''
}
<tr><td style="padding:0 28px 18px">
${paragraphs(outro, p)}
</td></tr>
<tr><td style="padding:16px 28px 22px;border-top:1px solid #eef0f6">
<p style="margin:0;font-family:${FONT};font-size:13px;line-height:1.5;color:${MUTED}">${escapeHtml(footer)}${
    vars.origin
      ? ` <a href="${escapeHtml(vars.origin)}" style="color:${INDIGO};font-weight:700">${escapeHtml(vars.origin.replace(/^https?:\/\//, ''))}</a>`
      : ''
  }</p>
</td></tr>
</table>`;

  const html = `<!doctype html>
<html lang="${lang === 'de' ? 'de-CH' : 'en'}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:${PAGE}">
<div style="display:none;max-height:0;overflow:hidden">${escapeHtml(heading)}${vars.code ? ` – ${escapeHtml(vars.code)}` : ''}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAGE}"><tr><td style="padding:28px 12px">
${bodyHtml}
</td></tr></table>
</body>
</html>`;

  const text = [
    heading,
    '',
    intro,
    '',
    ...(vars.report ?? []).flatMap((r) => [r.name, ...r.lines.map((l) => `  ${l}`), '']),
    vars.code ? `    ${vars.code}` : vars.origin ? `${OPEN[lang]}: ${vars.origin}` : '',
    '',
    outro,
    '',
    '--',
    footer + (vars.origin ? ` ${vars.origin}` : ''),
  ].join('\n');

  return { subject, text, html, bodyHtml };
}
