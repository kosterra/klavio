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
  await page.getByTestId('logout-confirm-go').click();
  await expect(page.getByRole('heading', { name: /Willkommen bei Klavio/ })).toBeVisible();
}

/** Marks lessons as completed (3 stars) for the page's active profile, directly in the dev DB. */
export async function seedCompletedLessons(page: Page, lessonIds: string[]) {
  const profileId = await page.evaluate(async () => {
    const me = await (await fetch('/api/auth/me')).json();
    return me.activeProfileId as string;
  });
  const docs = lessonIds.map(
    (id) =>
      `{ profileId: ObjectId(${JSON.stringify(profileId)}), lessonId: ${JSON.stringify(id)}, bestStars: 3, completions: 1 }`,
  );
  execFileSync('docker', [
    'compose',
    'exec',
    '-T',
    'mongo',
    'mongosh',
    'klavio',
    '--quiet',
    '--eval',
    `db.lessonprogresses.insertMany([${docs.join(',')}])`,
  ]);
}

/** Skips the "Entdecken" part if the lesson starts with it; returns at the start card. */
export async function skipTheory(page: Page) {
  const start = page.getByTestId('lesson-start');
  const skip = page.getByRole('button', { name: 'Überspringen' });
  await expect(start.or(skip)).toBeVisible();
  if (await skip.isVisible()) await skip.click();
  await expect(start).toBeVisible();
}

/** Skips the theory part (if any) and starts the lesson. */
export async function startLesson(page: Page) {
  await skipTheory(page);
  await page.getByTestId('lesson-start').click();
}

/**
 * «Im Takt»: starts the run and plays every note of the song on the screen
 * keys exactly on time (scheduled in the page, on the app's clock).
 */
export async function playTimedSong(page: Page): Promise<string> {
  const song = page.getByTestId('timed-song');
  await page.getByTestId('timed-start').click();
  await expect(song).toHaveAttribute('data-first-at', /\d/);
  await song.evaluate((el) => {
    const first = Number(el.dataset.firstAt);
    const beatMs = Number(el.dataset.beatMs);
    const notes = JSON.parse(el.dataset.notes!) as [number, number][];
    const names = ['C', 'Cis', 'D', 'Dis', 'E', 'F', 'Fis', 'G', 'Gis', 'A', 'Ais', 'H'];
    for (const [midi, at] of notes) {
      setTimeout(
        () => {
          const key = document.querySelector<HTMLButtonElement>(
            `button[aria-label="${names[midi % 12]}${Math.floor(midi / 12) - 1}"]`,
          );
          key?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
          setTimeout(
            () => key?.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })),
            60,
          );
        },
        first + at * beatMs - performance.now(),
      );
    }
  });
  const result = page.getByTestId('timed-result');
  await expect(result).toBeVisible({ timeout: 90_000 });
  // read at once: a good run goes on by itself after a moment
  return (await result.textContent()) ?? '';
}

/** A new profile starts with the start-up questions: skip them. */
export async function skipSetup(page: Page) {
  await page.getByTestId('setup-skip').click();
  await expect(page.getByTestId('setup')).toHaveCount(0);
}
