import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';
import { createMailer } from '../src/lib/mailer.js';

const base = {
  AUTH_SECRET: 'test-secret-test-secret-test-secret-123',
  APP_ORIGIN: 'https://klavio.test',
  RP_ID: 'klavio.test',
};
const mail = {
  to: 'anna@example.ch',
  template: 'login-code',
  subject: '123456 ist dein Klavio-Code',
  text: 'Code: 123456',
};

describe('mailer without SMTP_HOST', () => {
  it('in production logs only which mail it was – never the subject or the code', async () => {
    const lines: string[] = [];
    const config = loadConfig({ ...base, NODE_ENV: 'production' });
    await createMailer(config, (m) => lines.push(m)).send(mail);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('template=login-code');
    expect(lines[0]).not.toContain('123456');
    expect(lines[0]).not.toContain('anna@example.ch');
  });

  it('in development logs the whole mail', async () => {
    const lines: string[] = [];
    const config = loadConfig({ ...base, NODE_ENV: 'development' });
    await createMailer(config, (m) => lines.push(m)).send(mail);
    expect(lines[0]).toContain('123456');
  });
});
