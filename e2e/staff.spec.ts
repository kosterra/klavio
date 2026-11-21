import { expect, test, type Page } from '@playwright/test';
import { LESSONS } from '@klavio/shared';
import { seedCompletedLessons, signUpWithEmail, skipSetup, uniqueEmail } from './helpers';
import { audit } from './audit';

/** A new learner who has finished everything before «Das Notensystem». */
async function beforeTheStaff(page: Page, tag: string) {
  await signUpWithEmail(page, uniqueEmail(tag), 'Familie');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Noa');
  await page.getByRole('dialog').getByLabel('Geburtsjahr').fill('2016');
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await skipSetup(page);
  await expect(page.getByRole('heading', { name: 'Lernpfad' })).toBeVisible();
  const at = LESSONS.findIndex((l) => l.id === 'read-staff');
  await seedCompletedLessons(
    page,
    LESSONS.slice(0, at).map((l) => l.id),
  );
  await page.reload();
  await expect(page.getByTestId('path-read-staff')).toHaveAttribute('aria-current', 'step');
  await page.getByTestId('path-read-staff').click();
}

/** Clicks «Weiter» until the theory text matches (answering the recap questions on the way). */
async function nextUntil(page: Page, text: RegExp) {
  const next = page.getByTestId('theory-next');
  for (let i = 0; i < 20; i++) {
    if (await page.getByTestId('theory-text').filter({ hasText: text }).isVisible()) return;
    const answers = page.getByRole('group').getByRole('button');
    for (let a = 0; (await next.isDisabled()) && a < (await answers.count()); a++) {
      await answers.nth(a).click();
    }
    await next.click();
  }
  throw new Error(`no step ${text}`);
}

test('«Das Notensystem»: lines counted from below and the clef', async ({ page }) => {
  await beforeTheStaff(page, 'staff');
  // the offer to skip is there at the start
  await expect(page.getByTestId('skip-offer')).toBeVisible();
  await nextUntil(page, /von unten nach oben/);
  await expect(page.getByRole('img', { name: /von unten nummeriert/ })).toBeVisible();
  await expect(page.getByTestId('skip-offer')).toHaveCount(0);
  await page.getByTestId('theory-next').click();
  await expect(page.getByRole('img', { name: /2\. Linie ist markiert/ })).toBeVisible();
  await page.getByRole('button', { name: 'Die 3. Linie' }).click();
  await expect(page.getByRole('status')).toContainText('Zähl von unten');
  await page.getByRole('button', { name: 'Die 2. Linie' }).click();
  await expect(page.getByRole('status')).toContainText('Genau!');
  await audit(page);
  await nextUntil(page, /G-Schlüssel rollt sich/);
  await page.getByTestId('theory-next').click();
  await page.getByRole('button', { name: 'Auf der 2. Linie' }).click();
  await expect(page.getByRole('status')).toContainText('Genau!');
  await audit(page);
  await page.getByTestId('theory-next').click();
  // the start card: one task – find the G
  await expect(page.getByRole('heading', { name: 'Das Notensystem' })).toBeVisible();
});

test('«Ich kann schon»: three right answers skip the lesson', async ({ page }) => {
  await beforeTheStaff(page, 'staffskip');
  await page.getByTestId('skip-check').click();
  await expect(page.getByText('Kurzer Check', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'G-Schlüssel' }).click();
  await page.getByTestId('theory-next').click();
  await page.getByRole('button', { name: 'F', exact: true }).click();
  await page.getByTestId('theory-next').click();
  await page.getByRole('button', { name: 'H', exact: true }).click();
  await audit(page);
  await page.getByTestId('theory-next').click();
  await expect(page.getByText('Super, das kannst du schon!')).toBeVisible();
  await expect(page).toHaveURL(/\/lesson\/read-c-d-e$/);
});

test('«Ich kann schon»: a wrong answer leads into the lesson', async ({ page }) => {
  await beforeTheStaff(page, 'staffmiss');
  await page.getByTestId('skip-check').click();
  await page.getByRole('button', { name: 'F-Schlüssel' }).click();
  await page.getByRole('button', { name: 'G-Schlüssel' }).click();
  await page.getByTestId('theory-next').click();
  await page.getByRole('button', { name: 'F', exact: true }).click();
  await page.getByTestId('theory-next').click();
  await page.getByRole('button', { name: 'H', exact: true }).click();
  await page.getByTestId('theory-next').click();
  await expect(page.getByTestId('skip-offer')).toContainText('Schauen wir es zusammen an');
  await expect(page.getByTestId('theory-text')).toContainText('Musik kann man aufschreiben');
  await expect(page).toHaveURL(/\/lesson\/read-staff$/);
});
