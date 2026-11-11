import { expect, test } from '@playwright/test';
import { audit } from './audit';
import {
  grantAdmin,
  seedCompletedLessons,
  signUpWithEmail,
  uniqueEmail,
  skipSetup,
} from './helpers';

const MAILPIT = process.env.E2E_MAILPIT_URL ?? 'http://localhost:8026';

test('footer links to privacy, what’s new and the source; the privacy page explains the data', async ({
  page,
}) => {
  await page.goto('/welcome');
  const footer = page.getByTestId('site-footer');
  await expect(footer.getByRole('link', { name: 'Quellcode' })).toHaveAttribute(
    'href',
    /github\.com/,
  );
  await expect(footer.getByRole('link', { name: 'Was ist neu' })).toBeVisible();
  await footer.getByRole('link', { name: 'Datenschutz' }).click();

  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Datenschutz' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Mikrofon und Ton' })).toBeVisible();
  await expect(page.getByText(/nie aufgenommen, hochgeladen oder gespeichert/)).toBeVisible();
  await audit(page);
});

test('phones get a hint to install Klavio as an app', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36',
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto('/welcome');
  // a moment after the page: a sheet from the bottom with what the app brings and the steps
  const hint = page.getByRole('dialog', { name: 'Klavio als App' });
  await expect(hint).toBeVisible({ timeout: 8000 });
  await expect(hint).toContainText('Funktioniert auch ohne Internet');
  await expect(hint.getByRole('list', { name: 'So installierst du Klavio' })).toContainText(
    'App installieren',
  );
  await audit(page);
  // «Später»: gone for now, also after a reload
  await hint.getByTestId('install-later').click();
  await expect(hint).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.waitForTimeout(3500);
  await expect(page.getByRole('dialog', { name: 'Klavio als App' })).toHaveCount(0);
  // a week later it asks again – «Nicht mehr zeigen» ends it for good
  await page.evaluate(() => localStorage.removeItem('klavio.installHint.snoozedUntil'));
  await page.reload();
  await expect(hint).toBeVisible({ timeout: 8000 });
  await hint.getByTestId('install-never').click();
  await page.reload();
  await page.waitForTimeout(3500);
  await expect(page.getByRole('dialog', { name: 'Klavio als App' })).toHaveCount(0);
  await context.close();
});

test('admins name the operator and edit the e-mail texts in both languages', async ({ page }) => {
  test.setTimeout(120_000);
  const email = uniqueEmail('mailadmin');
  await signUpWithEmail(page, email, 'Admin');
  grantAdmin(email);
  await page.goto('/admin');

  // operator and contact appear in the footer and on the privacy page
  await page.getByLabel('Name (Person oder Organisation)').fill('Familie Muster');
  await page.getByLabel('Kontakt-E-Mail').fill('kontakt@example.ch');
  await page.getByTestId('operator-card').getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByText('Betreiber und Kontakt gespeichert.')).toBeVisible();

  // e-mail texts: the preview follows every keystroke
  const card = page.getByTestId('mail-templates');
  await card.getByLabel('Überschrift').fill('Willkommen zurück bei {{app}}');
  await expect(card.getByTestId('mail-preview')).toContainText('Willkommen zurück bei Klavio');
  await expect(card.getByTestId('mail-preview')).toContainText('123456');
  await card.getByText('English').click();
  await expect(card.getByLabel('Betreff')).toHaveValue('{{code}} is your {{app}} code');
  await audit(page);
  await card.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByText('E-Mail-Vorlage gespeichert.')).toBeVisible();
  await expect(card.getByText('Angepasst')).toBeVisible();

  // the next German code mail uses the new heading, in Klavio's design
  const other = uniqueEmail('mailuser');
  const res = await page.request.post('/api/auth/email/request', {
    data: { email: other, lang: 'de' },
    headers: { origin: new URL(page.url()).origin },
  });
  expect(res.status()).toBe(204);
  let html = '';
  for (let i = 0; i < 40 && !html; i++) {
    const list = (await (
      await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${other}`)}&limit=1`)
    ).json()) as { messages: { ID: string }[] };
    if (list.messages[0]) {
      const msg = (await (
        await fetch(`${MAILPIT}/api/v1/message/${list.messages[0].ID}`)
      ).json()) as {
        HTML: string;
      };
      html = msg.HTML;
    } else await new Promise((r) => setTimeout(r, 250));
  }
  expect(html).toContain('Willkommen zurück bei Klavio');

  // back to the built-in texts
  await card.getByRole('button', { name: 'Standardtexte wiederherstellen' }).click();
  await expect(card.getByText('Standardtexte', { exact: true })).toBeVisible();

  await page.goto('/privacy');
  await expect(page.getByTestId('privacy-responsible')).toContainText('Familie Muster');
  await expect(page.getByTestId('privacy-responsible').getByRole('link')).toHaveAttribute(
    'href',
    'mailto:kontakt@example.ch',
  );
  await expect(
    page.getByTestId('site-footer').getByText('Betrieben von Familie Muster'),
  ).toBeVisible();

  // leave the instance as it was for the other specs
  await page.goto('/admin');
  await page.getByLabel('Name (Person oder Organisation)').fill('');
  await page.getByLabel('Kontakt-E-Mail').fill('');
  await page.getByTestId('operator-card').getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByText('Betreiber und Kontakt gespeichert.')).toBeVisible();
});

test('adults travel in four stages – through the hard stretch – up to their dream song', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await signUpWithEmail(page, uniqueEmail('journey'), 'Ralph');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Ralph');
  await page.getByRole('dialog').getByLabel('Geburtsjahr').fill('1990');
  await page.getByTestId('profile-more').click();
  await page.getByRole('dialog').getByText('Classic', { exact: true }).click();
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await skipSetup(page);

  const journey = page.getByTestId('journey');
  await expect(journey).toContainText('Vier Etappen bis zu deinem Traumlied');
  await expect(page.getByTestId('journey-phase')).toContainText('Jetzt legst du die Grundlagen');
  // the hard stretch is announced before it comes, with what helps
  await expect(page.getByTestId('journey-hard')).toContainText('Hier wird’s zäh');
  await expect(page.getByTestId('stage-start')).toContainText('Du bist hier');
  await expect(page.getByTestId('journey-estimate')).toContainText('Wochenziel');
  // grown-ups play pieces where children play children's songs
  await page.goto('/songs');
  await expect(page.getByTestId('song-song-haenschen')).toContainText('Going Home – Dvořák');
  await expect(page.getByTestId('song-hand-entchen')).toContainText('Morgenstimmung');
  await page.goto('/');
  // the chapters are the journey's stations, with their altitude
  await expect(page.getByTestId('chapter-keys')).toContainText('Alp · 1500 m');
  await audit(page);

  // through the first five chapters: now in hell
  const { CURRICULUM } = await import('@klavio/shared');
  const before = CURRICULUM.slice(0, 5).flatMap((c) => c.lessons.map((l) => l.id));
  await seedCompletedLessons(page, before);
  await page.reload();
  await expect(page.getByTestId('journey-phase')).toContainText('Du steckst in der Durststrecke');
  await expect(page.getByTestId('stage-grind')).toContainText('Du bist hier');
  await expect(page.getByTestId('stage-start')).toContainText('Geschafft');
  await page.getByTestId('stage-switch').getByText(/2/).first().click();
  await expect(page.getByTestId('chapter-bass')).toContainText('Die Hölle · −666 m');
  await audit(page);
});

test('the year of birth decides whether a profile can choose the journey', async ({ page }) => {
  test.setTimeout(90_000);
  const year = new Date().getFullYear();
  await signUpWithEmail(page, uniqueEmail('worlds'), 'Familie');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Name').fill('Lina');
  // a birth year is required
  await dialog.getByRole('button', { name: 'Profil erstellen' }).click();
  await expect(dialog.getByText('Bitte das Geburtsjahr eintragen.')).toBeVisible();
  // young children: colourful worlds only (view, world and goal sit under «Mehr einstellen»)
  await dialog.getByLabel('Geburtsjahr').fill(String(year - 7));
  await dialog.getByTestId('profile-more').click();
  await expect(dialog.getByText('Wird dieses Jahr 7 Jahre alt.')).toBeVisible();
  await expect(dialog.getByTestId('world-locked')).toContainText('Ab 12 Jahren');
  await expect(dialog.getByTestId('world-choice')).toHaveCount(0);
  // from 12 on: both worlds – a Kids profile can travel the journey
  await dialog.getByLabel('Geburtsjahr').fill(String(year - 13));
  await dialog.getByTestId('world-choice').getByText('Die Reise').click();
  // a 13-year-old still starts in the Kids view
  await expect(dialog.getByRole('radio', { name: 'Kids' })).toBeChecked();
  await audit(page);
  await dialog.getByRole('button', { name: 'Profil erstellen' }).click();
  await skipSetup(page);
  await expect(page.getByTestId('journey')).toBeVisible();
  await expect(page.getByTestId('chapter-keys')).toContainText('Alp');
});
