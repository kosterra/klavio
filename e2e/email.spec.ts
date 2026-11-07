import { execFileSync } from 'node:child_process';
import { expect, test, type Page } from '@playwright/test';

const MAILPIT = process.env.E2E_MAILPIT_URL ?? 'http://localhost:8026';

/** Promote a user to admin directly in the dev database (what `npm run admin:grant` does). */
function grantAdmin(displayName: string) {
  execFileSync('docker', [
    'compose',
    'exec',
    '-T',
    'mongo',
    'mongosh',
    'klavio',
    '--quiet',
    '--eval',
    `db.users.updateOne({ displayName: ${JSON.stringify(displayName)} }, { $set: { role: 'admin' } })`,
  ]);
}

async function latestCodeFor(email: string): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const res = await fetch(
      `${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}&limit=1`,
    );
    const data = (await res.json()) as { messages: { Subject: string }[] };
    const subject = data.messages[0]?.Subject;
    const code = subject?.match(/\d{6}/)?.[0];
    if (code) return code;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`no mail for ${email}`);
}

async function setEmailLogin(page: Page, enabled: boolean) {
  await page.goto('/admin');
  const toggle = page.getByRole('switch', { name: 'Anmeldung per E-Mail-Code erlauben' });
  await expect(toggle).toBeEnabled();
  if ((await toggle.isChecked()) !== enabled) await toggle.click({ force: true });
  await expect(toggle).toBeChecked({ checked: enabled });
}

test('admin enables e-mail login; new user signs up with an e-mail code', async ({ browser }) => {
  // --- admin (passkey account)
  const adminCtx = await browser.newContext();
  const admin = await adminCtx.newPage();
  const cdp = await adminCtx.newCDPSession(admin);
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
  const adminName = `Admin ${Date.now()}`;
  await admin.goto('/welcome');
  await admin.getByRole('button', { name: 'Neues Konto' }).click();
  await admin.getByLabel('Wie heisst du?').fill(adminName);
  await admin.getByRole('button', { name: 'Passkey erstellen' }).click();
  await admin.getByRole('button', { name: 'Ich habe die Codes gesichert' }).click();
  grantAdmin(adminName);
  await setEmailLogin(admin, true);

  // --- new user via e-mail code
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const email = `e2e-${Date.now()}@example.ch`;
  await page.goto('/welcome');
  await page.getByRole('link', { name: 'Mit E-Mail-Code anmelden' }).click();
  await page.getByLabel('E-Mail-Adresse').fill(email);
  await page.getByRole('button', { name: 'Code senden' }).click();
  await expect(page.getByText('Falls die Adresse gültig ist')).toBeVisible();

  const code = await latestCodeFor(email);
  await page.getByRole('textbox').nth(1).click();
  await page.keyboard.type(code);
  await page.getByRole('button', { name: 'Anmelden' }).click();

  await page.getByLabel(/noch kein Konto/).fill('Eva');
  await page.getByRole('button', { name: 'Konto erstellen' }).click();
  await expect(page.getByRole('heading', { name: 'Deine Wiederherstellungscodes' })).toBeVisible();
  await page.getByRole('button', { name: 'Ich habe die Codes gesichert' }).click();
  await expect(page.getByRole('heading', { name: 'Wer spielt heute?' })).toBeVisible();

  // --- switching it off hides the option again
  await setEmailLogin(admin, false);
  const anon = await (await browser.newContext()).newPage();
  await anon.goto('/welcome');
  await expect(anon.getByRole('button', { name: 'Neues Konto' })).toBeVisible();
  await expect(anon.getByRole('link', { name: 'Mit E-Mail-Code anmelden' })).toHaveCount(0);
});
