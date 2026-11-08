import { expect, test } from '@playwright/test';
import { LESSONS } from '@klavio/shared';
import { audit } from './audit';
import { seedCompletedLessons, signUpWithEmail, uniqueEmail } from './helpers';

test('the first lesson starts with "Entdecken": explanations, games and a quiz', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await signUpWithEmail(page, uniqueEmail('theory'), 'Familie Ton');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Lia');
  await page.getByRole('dialog').getByLabel('Geburtsjahr').fill('2016');
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await page.getByRole('link', { name: 'Erste Lektion starten' }).click();

  const text = page.getByTestId('theory-text');
  const next = page.getByTestId('theory-next');
  const status = page.getByRole('status');

  // 0 how to sit at the piano
  await expect(text).toContainText('So sitzt du gut am Klavier');
  await next.click();
  // 1 explanation with the groups of black keys
  await expect(text).toContainText('weisse und schwarze');
  await audit(page);
  await next.click();

  // 2 tap the groups of two: "Weiter" only once both are found; a wrong key gives a hint
  await expect(text).toContainText('Zweiergruppen');
  await expect(next).toBeDisabled();
  await page.getByRole('button', { name: 'Fis3' }).click();
  await expect(status).toContainText('nebeneinander');
  await page.getByRole('button', { name: 'Cis3' }).click();
  await expect(status).toContainText('1 von 2');
  await page.getByRole('button', { name: 'Dis4' }).click();
  await expect(status).toContainText('Genau!');
  await next.click();

  // 3 groups of three
  await page.getByRole('button', { name: 'Gis3' }).click();
  await page.getByRole('button', { name: 'Ais4' }).click();
  await next.click();

  // 4 + 5 explanations
  await expect(text).toContainText('C, D, E, F, G, A, H');
  await next.click();
  await expect(text).toContainText('tiefer');
  await next.click();

  // 6 listening game: higher, lower, higher, lower
  await expect(text).toContainText('Hör gut zu');
  for (const [i, answer] of ['Höher', 'Tiefer', 'Höher', 'Tiefer'].entries()) {
    await expect(page.getByText(`Runde ${i + 1} von 4`)).toBeVisible();
    await page.getByRole('button', { name: answer, exact: true }).click();
  }
  await expect(status).toContainText('alles richtig');
  await audit(page);
  await next.click();

  // 7 find any C, then on to the lesson
  await page.getByRole('button', { name: 'C4' }).click();
  await expect(status).toContainText('Genau!');
  await expect(next).toHaveText('Jetzt spielen!');
  await next.click();

  await expect(page.getByTestId('lesson-start')).toBeVisible();
  // the theory can be opened again from the start card
  await page.getByTestId('theory-again').click();
  await expect(text).toContainText('So sitzt du gut am Klavier');
});

test('quiz: wrong answers get a hint, the right one unlocks "Weiter"', async ({ page }) => {
  test.setTimeout(90_000);
  await signUpWithEmail(page, uniqueEmail('quiz'), 'Familie Quiz');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Noa');
  await page.getByRole('dialog').getByLabel('Geburtsjahr').fill('2016');
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await expect(page.getByRole('heading', { name: 'Lernpfad' })).toBeVisible();
  // jump to a lesson with a quiz: keys-d-e needs the two lessons before
  await seedCompletedLessons(page, ['keys-c', 'keys-middle-c']);
  await page.goto('/lesson/keys-d-e');
  const next = page.getByTestId('theory-next');
  await next.click(); // explanation
  await page.getByRole('button', { name: 'D3' }).click();
  await page.getByRole('button', { name: 'D4' }).click();
  await expect(next).toBeEnabled();
  await next.click();
  await expect(next).toBeDisabled();
  await page.getByRole('button', { name: 'C', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('kleine Haus');
  await expect(next).toBeDisabled();
  await page.getByRole('button', { name: 'D', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Genau!');
  await audit(page);
  await next.click();
  await expect(page.getByTestId('lesson-start')).toBeVisible();
});

test('reading and rhythm theory: staff lines/spaces, pizza note values, clap game', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await signUpWithEmail(page, uniqueEmail('theory2'), 'Familie Takt');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Mo');
  await page.getByRole('dialog').getByLabel('Geburtsjahr').fill('2016');
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await expect(page.getByRole('heading', { name: 'Lernpfad' })).toBeVisible();
  const ids = LESSONS.map((l) => l.id);
  // all played: «Nochmals entdecken» opens just the lesson's theory (no recap)
  await seedCompletedLessons(page, ids.slice(0, ids.indexOf('rhythm-quarters') + 1));

  const next = page.getByTestId('theory-next');
  const again = page.getByTestId('theory-again');

  // reading: line / space pictures and the quiz (played lessons open via "again")
  await page.goto('/lesson/read-c-d-e');
  await again.click();
  await next.click();
  await expect(page.getByRole('img', { name: /Linien sind markiert/ })).toBeVisible();
  await next.click();
  await expect(page.getByRole('img', { name: /Zwischenräume sind markiert/ })).toBeVisible();
  await next.click();
  await page.getByRole('button', { name: 'In einem Zwischenraum' }).click();
  await expect(page.getByRole('status')).toContainText('Linie mitten');
  await page.getByRole('button', { name: 'Auf einer Linie' }).click();
  await expect(page.getByRole('status')).toContainText('Genau!');
  await audit(page);

  // rhythm: pizza note values, then the clap game appears
  await page.goto('/lesson/rhythm-quarters');
  await again.click();
  await expect(page.getByText('Ganze', { exact: true })).toBeVisible();
  await expect(page.getByText('4 Schläge')).toBeVisible();
  await audit(page);
  await next.click();
  await page.getByRole('button', { name: 'Die Halbe' }).click();
  await next.click();
  await next.click();
  await expect(page.getByTestId('theory-text')).toContainText('vier Viertel');
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.getByRole('button', { name: 'Klatsch!' })).toBeVisible();
  await audit(page);
});

test('"Wissen" lists what was discovered; a new chapter starts with "Weisst du’s noch?"', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await signUpWithEmail(page, uniqueEmail('wissen'), 'Familie Wissen');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Ela');
  await page.getByRole('dialog').getByLabel('Geburtsjahr').fill('2016');
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await expect(page.getByRole('heading', { name: 'Lernpfad' })).toBeVisible();
  const ids = LESSONS.map((l) => l.id);
  await seedCompletedLessons(page, ids.slice(0, ids.indexOf('hand-a-h')));

  // knowledge page via the menu
  await page.getByTestId('nav-toggle').click();
  await page.getByTestId('side-nav').getByRole('link', { name: 'Wissen' }).click();
  await expect(page.getByRole('heading', { name: 'Wissen', level: 1 })).toBeVisible();
  await expect(page.getByTestId('knowledge-keys-c')).toContainText('schwarze');
  await expect(page.getByTestId('knowledge-hand-a-h')).toBeVisible(); // reached, not played yet
  await expect(page.getByText('Alle weissen Tasten – noch nicht entdeckt')).toBeVisible();
  await audit(page);

  // first lesson of chapter 2: recap questions from chapter 1 come first
  await page.getByTestId('knowledge-hand-a-h').getByRole('link', { name: 'Zur Lektion' }).click();
  const text = page.getByTestId('theory-text');
  await expect(text).toContainText('Weisst du’s noch?');
  await page.getByTestId('theory-next').click();
  await expect(page.getByTestId('theory-next')).toBeDisabled(); // a quiz from chapter 1
  await expect(page.getByRole('group').first()).toBeVisible();
});
