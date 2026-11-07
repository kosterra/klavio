import { execFileSync } from 'node:child_process';
import { expect, type BrowserContext, type Page } from '@playwright/test';

const MAILPIT = process.env.E2E_MAILPIT_URL ?? 'http://localhost:8026';

export const uniqueEmail = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.ch`;

/** Chromium's virtual WebAuthn authenticator: real passkey crypto, no OS dialog. */
export async function addVirtualAuthenticator(context: BrowserContext, page: Page) {
  const cdp = await context.newCDPSession(page);
  await cdp.send('WebAuthn.enable');
  await cdp.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      transport: 'internal',
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });
}

/** Reads the newest code sent to `email` from Mailpit (the code is in the subject). */
export async function latestCodeFor(email: string, notCode?: string): Promise<string> {
  for (let i = 0; i < 40; i++) {
    const res = await fetch(
      `${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}&limit=1`,
    );
    const data = (await res.json()) as { messages: { Subject: string }[] };
    const code = data.messages[0]?.Subject.match(/\d{6}/)?.[0];
    if (code && code !== notCode) return code;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`no (new) mail for ${email}`);
}

async function enterCode(page: Page, code: string) {
  // PinInput: one box per digit; typing into the first box fills them all.
  await page.getByRole('textbox').nth(1).click();
  await page.keyboard.type(code);
}

/** Welcome → "Konto erstellen" → e-mail → code → name. Ends on the profile picker. */
export async function signUpWithEmail(page: Page, email: string, name: string) {
  await page.goto('/welcome');
  await page.getByRole('link', { name: 'Konto erstellen' }).click();
  await expect(page.getByRole('heading', { name: 'Konto erstellen' })).toBeVisible();
  await page.getByLabel('E-Mail-Adresse').fill(email);
  await page.getByRole('button', { name: 'Code senden' }).click();
  await expect(page.getByText('Falls die Adresse gültig ist')).toBeVisible();
  const code = await latestCodeFor(email);
  await enterCode(page, code);
  await page.getByRole('button', { name: 'Weiter' }).click();
  await page.getByLabel(/noch kein Konto/).fill(name);
  await page.getByRole('button', { name: 'Konto erstellen' }).click();
  await expect(page.getByRole('heading', { name: 'Wer spielt heute?' })).toBeVisible();
  return code;
}

/** Welcome → "Mit E-Mail-Code anmelden" for an existing account. */
export async function loginWithEmail(page: Page, email: string, previousCode?: string) {
  await page.goto('/welcome');
  await page.getByRole('link', { name: 'Mit E-Mail-Code anmelden' }).click();
  await page.getByLabel('E-Mail-Adresse').fill(email);
  await page.getByRole('button', { name: 'Code senden' }).click();
  await enterCode(page, await latestCodeFor(email, previousCode));
  await page.getByRole('button', { name: 'Anmelden' }).click();
  await expect(page.getByRole('heading', { name: 'Wer spielt heute?' })).toBeVisible();
}

/** Promote a user to admin directly in the dev database (what `npm run admin:grant` does). */
export function grantAdmin(email: string) {
  execFileSync('docker', [
    'compose',
    'exec',
    '-T',
    'mongo',
    'mongosh',
    'klavio',
    '--quiet',
    '--eval',
    `db.users.updateOne({ email: ${JSON.stringify(email)} }, { $set: { role: 'admin' } })`,
  ]);
}

export async function logout(page: Page) {
  if (!(await page.getByRole('button', { name: 'Menü' }).isVisible())) await page.goto('/account');
  await page.getByRole('button', { name: 'Menü' }).click();
  await page.getByRole('menuitem', { name: 'Abmelden' }).click();
  await expect(page.getByRole('heading', { name: /Willkommen bei Klavio/ })).toBeVisible();
}
