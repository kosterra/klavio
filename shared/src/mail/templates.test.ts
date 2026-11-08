import { describe, expect, it } from 'vitest';
import { DEFAULT_MAIL_TEMPLATES, mailLangOf, mailTemplateSchema, renderMail } from './templates.ts';

describe('mail templates', () => {
  it('fills the placeholders in subject, text and HTML', () => {
    const mail = renderMail(DEFAULT_MAIL_TEMPLATES['login-code'].de, 'de', {
      code: '123456',
      origin: 'https://klavio.example',
    });
    expect(mail.subject).toBe('123456 ist dein Klavio-Code');
    expect(mail.text).toContain('123456');
    expect(mail.text).toContain('10 Minuten');
    expect(mail.html).toContain('>123456</div>');
    expect(mail.html).toContain('lang="de-CH"');
    expect(mail.html).toContain('href="https://klavio.example"');
    expect(mail.html).not.toContain('{{');
  });

  it('escapes what admins type and keeps their paragraphs', () => {
    const mail = renderMail(
      { subject: '{{code}}', heading: '<b>Hi</b>', intro: 'one\ntwo\n\nthree', outro: '' },
      'en',
      { code: '000111' },
    );
    expect(mail.bodyHtml).toContain('&lt;b&gt;Hi&lt;/b&gt;');
    expect(mail.bodyHtml).not.toContain('<b>Hi</b>');
    expect(mail.bodyHtml).toMatch(/one<br>two<\/p><p[^>]*>three/);
  });

  it('leaves unknown placeholders as they are', () => {
    const mail = renderMail(
      { subject: '{{code}} {{nope}}', heading: 'x', intro: '', outro: '' },
      'en',
      { code: '1' },
    );
    expect(mail.subject).toBe('1 {{nope}}');
  });

  it('has valid defaults in both languages for every mail', () => {
    for (const texts of Object.values(DEFAULT_MAIL_TEMPLATES)) {
      expect(mailTemplateSchema.safeParse(texts).success).toBe(true);
      expect(texts.de.subject).toContain('{{code}}');
      expect(texts.en.subject).toContain('{{code}}');
    }
  });

  it('maps UI languages to mail languages', () => {
    expect(mailLangOf('de-CH')).toBe('de');
    expect(mailLangOf('en')).toBe('en');
    expect(mailLangOf('en-GB')).toBe('en');
    expect(mailLangOf(undefined)).toBe('de');
  });
});
