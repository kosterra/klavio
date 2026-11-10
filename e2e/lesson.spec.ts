import { expect, test, type Page } from '@playwright/test';
import { signUpWithEmail, uniqueEmail, skipTheory, skipSetup } from './helpers';
import { audit } from './audit';

/** No MIDI, microphone denied → the lesson falls back to the on-screen keyboard. */
async function denyMicrophone(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, 'requestMIDIAccess', { value: undefined });
    navigator.mediaDevices.getUserMedia = () =>
      Promise.reject(new DOMException('denied', 'NotAllowedError'));
  });
}

const key = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const summary = (page: Page) => page.getByRole('button', { name: 'Zum Lernpfad' });

/**
 * Plays a lesson to its summary, part by part: "Finde die Taste" (read the
 * asked note, tap it in the 4th octave) and "Spiel nach" (tap the highlighted
 * bubble's note). Waits for lasting state (task counter, sequence, summary),
 * not for the short feedback text.
 */
async function solveLesson(page: Page, { mistakeFirst = false } = {}) {
  const counter = page.getByText(/^Aufgabe \d+ von \d+$/);
  const prompt = page.getByTestId('prompt');
  const sequence = page.getByTestId('sequence');
  let first = true;
  while (!(await summary(page).isVisible())) {
    if (await sequence.isVisible()) {
      // "Spiel nach"
      const current = sequence.locator('[aria-current="step"]');
      if (!(await current.count())) {
        await page.waitForTimeout(100); // between two sequences
        continue;
      }
      const note = (await current.getAttribute('aria-label'))!.split(',')[0]!;
      await key(page, `${note}4`).click();
      continue;
    }
    // "Finde die Taste" – allTextContents() does not wait (it disappears at the end)
    const before = (await counter.allTextContents())[0] ?? null;
    const note = /Finde das (\S+)/.exec((await prompt.allTextContents())[0] ?? '')?.[1];
    if (!note || before === null) {
      await page.waitForTimeout(100);
      continue;
    }
    if (first && mistakeFirst) {
      await key(page, note === 'D' ? 'E4' : 'D4').click();
      // kids mode: after a miss the right key gets marked
      await expect(page.getByText('Schau, die markierte Taste hilft dir.')).toBeVisible();
    }
    first = false;
    await key(page, /\d$/.test(note) ? note : `${note}4`).click();
    // next task (counter changed), the next part or the lesson summary
    await expect(
      summary(page)
        .or(sequence)
        .or(counter.filter({ hasNotText: before })),
    ).toBeVisible();
  }
}

async function startLesson(page: Page, title: string) {
  await skipTheory(page);
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
  await page.getByTestId('lesson-start').click();
}

test('learning path: play lessons, earn stars and XP, unlock the next ones', async ({ page }) => {
  test.setTimeout(120_000);
  await denyMicrophone(page);
  await signUpWithEmail(page, uniqueEmail('lesson'), 'Familie');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Lina');
  await page.getByRole('dialog').getByLabel('Geburtsjahr').fill('2016');
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await skipSetup(page);

  // --- dashboard: first lesson current, the rest locked
  await expect(page.getByRole('heading', { name: 'Lernpfad' })).toBeVisible();
  await expect(page.getByTestId('path-keys-c')).toHaveAttribute('aria-current', 'step');
  await expect(page.getByTestId('path-keys-middle-c')).toHaveCount(0);
  await expect(
    page.getByRole('img', { name: /Lektion 2, Tasten finden: Das mittlere C, noch gesperrt/ }),
  ).toBeVisible();
  await audit(page);

  // --- lesson 1 "Wo ist das C?" with one mistake → 2 stars
  await page.getByRole('link', { name: 'Erste Lektion starten' }).click();
  await audit(page);
  await startLesson(page, 'Wo ist das C?');
  // one line; the reason on request
  await expect(page.getByTestId('mic-off')).toContainText('Mikrofon aus');
  await page.getByTestId('mic-off').getByRole('button', { name: 'Warum?' }).click();
  await expect(page.getByText(/Zugriff auf das Mikrofon wurde verweigert/)).toBeVisible();
  await audit(page);
  await solveLesson(page, { mistakeFirst: true });
  await expect(page.getByRole('heading', { name: 'Sehr gut!' })).toBeVisible();
  await expect(page.getByTestId('xp-gained')).toHaveText('+20 XP');
  await expect(page.getByText('1 Tag in Folge')).toBeVisible();
  await expect(page.getByTestId('new-badges')).toContainText('Neues Abzeichen!');
  await expect(page.getByTestId('new-badges')).toContainText('Erste Lektion');
  await audit(page);

  // --- lesson 2 via "next", perfect → 3 stars
  await page.getByRole('button', { name: 'Nächste Lektion' }).click();
  await startLesson(page, 'Das mittlere C');
  await solveLesson(page);
  await expect(page.getByRole('heading', { name: 'Perfekt!' })).toBeVisible();
  await expect(page.getByTestId('xp-gained')).toHaveText('+25 XP');
  await expect(page.getByTestId('new-badges')).toContainText('Perfekt!');

  // --- lessons 3 (find D/E) and 4 (play along C-D-E)
  await page.getByRole('button', { name: 'Nächste Lektion' }).click();
  await startLesson(page, 'D und E');
  await solveLesson(page);
  // 20 + 25 + 25 = 70 XP → level 2 (from 50 XP)
  await expect(page.getByText('Neues Level: 2!')).toBeVisible();
  await page.getByRole('button', { name: 'Nächste Lektion' }).click();
  await startLesson(page, 'C, D, E nachspielen');
  await expect(page.getByTestId('sequence')).toBeVisible();
  await audit(page);
  await solveLesson(page);
  await expect(page.getByRole('heading', { name: 'Perfekt!' })).toBeVisible();
  await expect(page.getByTestId('xp-gained')).toHaveText('+30 XP'); // 100 XP in total
  await expect(page.getByText(/Neues Level/)).toHaveCount(0);

  // --- back on the path: stars shown, lesson 5 is next
  await summary(page).click();
  await expect(page.getByTestId('path-keys-c')).toHaveAccessibleName(/2 von 3 Sternen/);
  await expect(page.getByTestId('path-keys-cde')).toHaveAccessibleName(/3 von 3 Sternen/);
  await expect(page.getByTestId('path-keys-f-g')).toHaveAttribute('aria-current', 'step');
  await expect(page.getByRole('link', { name: 'Weiter: F und G' })).toBeVisible();
  await expect(page.getByTestId('xp-total')).toHaveText('100 XP');
  await expect(page.getByTestId('badge-first-lesson')).toHaveAttribute('data-earned', 'true');
  await expect(page.getByTestId('badge-perfect')).toHaveAttribute('data-earned', 'true');
  await expect(page.getByTestId('badge-first-song')).toHaveAttribute('data-earned', 'false');
  if (process.env.E2E_SCREENSHOTS) {
    await page.screenshot({ path: `${process.env.E2E_SCREENSHOTS}/path.png`, fullPage: true });
  }
  await audit(page);

  // --- a replay is possible and keeps the best result
  await page.getByTestId('path-keys-c').click();
  await startLesson(page, 'Wo ist das C?');
  await solveLesson(page);
  await expect(page.getByTestId('xp-gained')).toHaveText('+10 XP'); // half of 10 + 5 for the extra star
});
