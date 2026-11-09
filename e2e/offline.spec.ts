import { expect, test, type Page } from '@playwright/test';
import { signUpWithEmail, uniqueEmail, skipTheory, skipSetup } from './helpers';
import { audit } from './audit';

const key = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

async function solveFindC(page: Page) {
  const summary = page.getByRole('button', { name: 'Zum Lernpfad' });
  const counter = page.getByText(/^Aufgabe \d+ von \d+$/);
  while (!(await summary.isVisible())) {
    const before = (await counter.allTextContents())[0];
    if (!before) continue;
    await key(page, 'C4').click();
    await expect(summary.or(counter.filter({ hasNotText: before }))).toBeVisible();
  }
}

test('lessons work offline; results are synced when back online', async ({ page, context }) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () =>
      Promise.reject(new DOMException('denied', 'NotAllowedError'));
  });
  await signUpWithEmail(page, uniqueEmail('offline'), 'Familie');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Ida');
  await page.getByRole('dialog').getByLabel('Geburtsjahr').fill('2016');
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await skipSetup(page);
  await expect(page.getByRole('heading', { name: 'Lernpfad' })).toBeVisible();

  // open the lesson once while online (the dev server has no service worker
  // that would have precached the lesson page)
  await page.getByRole('link', { name: 'Erste Lektion starten' }).click();
  await skipTheory(page);

  if (process.env.E2E_BASE_URL?.startsWith('https')) {
    // production build: wait until the service worker controls the page
    await page.waitForFunction(() => !!navigator.serviceWorker?.controller, null, {
      timeout: 15_000,
    });
  }

  // --- offline: play the whole lesson
  await context.setOffline(true);
  await page.getByTestId('lesson-start').click();
  await solveFindC(page);
  await expect(page.getByRole('heading', { name: 'Perfekt!' })).toBeVisible();
  await expect(page.getByTestId('pending')).toContainText('Du bist gerade offline');
  await expect(page.getByTestId('xp-gained')).toHaveText('+25 XP');
  await audit(page);

  // the next lesson is unlocked on the device
  await page.getByRole('button', { name: 'Zum Lernpfad' }).click();
  await expect(page.getByTestId('offline-badge')).toBeVisible();
  await expect(page.getByTestId('path-keys-c')).toHaveAccessibleName(/3 von 3 Sternen/);
  await expect(page.getByTestId('path-keys-middle-c')).toHaveAttribute('aria-current', 'step');
  await expect(page.getByTestId('xp-total')).toHaveText('25 XP'); // computed locally

  if (process.env.E2E_BASE_URL?.startsWith('https')) {
    // with the service worker (production build) the app even starts offline
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Lernpfad' })).toBeVisible();
    await expect(page.getByTestId('offline-badge')).toBeVisible();
  }

  // --- back online: the result is sent, badges arrive
  await context.setOffline(false);
  await expect(page.getByText('1 offline gespielte Lektion gespeichert.')).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByTestId('offline-badge')).toHaveCount(0);
  await expect(page.getByTestId('badge-first-lesson')).toHaveAttribute('data-earned', 'true');
  await expect(page.getByTestId('path-keys-c')).toHaveAccessibleName(/3 von 3 Sternen/);
  await expect(page.getByTestId('xp-total')).toHaveText('25 XP'); // now from the server
});
