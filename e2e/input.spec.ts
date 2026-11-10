import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import {
  seedCompletedLessons,
  signUpWithEmail,
  skipTheory,
  uniqueEmail,
  skipSetup,
} from './helpers';
import { audit } from './audit';
import { installFakeMidi } from './fixtures/fakeMidi';

const MIC_FIXTURE = join(import.meta.dirname, '..', 'test-results', 'mic-fixture.wav');

test.use({
  permissions: ['microphone'],
  launchOptions: {
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      `--use-file-for-fake-audio-capture=${MIC_FIXTURE}%noloop`,
    ],
  },
});

const midi = (page: Page, bytes: number[]) =>
  page.evaluate(
    (b) => (window as never as { __fakeMidi: { send(b: number[]): void } }).__fakeMidi.send(b),
    bytes,
  );

test('MIDI, on-screen keyboard and computer keys share one input; MIDI beats the microphone', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.addInitScript(installFakeMidi);
  await signUpWithEmail(page, uniqueEmail('input'), 'Input');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Mira');
  await page.getByRole('dialog').getByLabel('Geburtsjahr').fill('2016');
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await skipSetup(page);

  await page.getByTestId('nav-toggle').click();
  await page.getByTestId('side-nav').getByRole('link', { name: 'Eingabe' }).click();
  await expect(page.getByRole('heading', { name: 'Wie spielst du?' })).toBeVisible();
  await expect(page.getByText('Aktiv: Bildschirm')).toBeVisible();
  await audit(page);

  const last = page.getByTestId('last-note');
  const source = page.getByTestId('last-source');

  // --- on-screen keyboard (tap) and computer keyboard (G = G4)
  await page.getByRole('button', { name: 'E4', exact: true }).click();
  await expect(last).toHaveText('E4');
  await expect(source).toHaveText('Bildschirm');
  await page.keyboard.press('KeyG');
  await expect(last).toHaveText('G4');

  // --- MIDI: connect, play, priority
  await page.getByRole('button', { name: 'MIDI verbinden' }).click();
  await expect(page.getByRole('listitem').filter({ hasText: 'Klavio Test Piano' })).toBeVisible();
  await expect(page.getByText('Aktiv: MIDI (Klavio Test Piano)')).toBeVisible();
  await midi(page, [0x90, 60, 100]);
  await expect(last).toHaveText('C4');
  await expect(source).toHaveText('MIDI');
  // the screen keyboard lights up the key played on the MIDI device
  await expect(page.getByRole('button', { name: 'C4', exact: true })).toHaveClass(/_active_/);
  if (process.env.E2E_SCREENSHOTS) {
    await page.screenshot({ path: `${process.env.E2E_SCREENSHOTS}/input.png`, fullPage: true });
  }
  await midi(page, [0x80, 60, 0]);
  await expect(page.getByRole('button', { name: 'C4', exact: true })).not.toHaveClass(/_active_/);
  await audit(page);

  // microphone hears the "digital piano" (fixture: A4 after 4 s) → ignored because of MIDI
  await page.getByRole('button', { name: 'Hier testen' }).click();
  await expect(page.getByText('pausiert (MIDI)')).toBeVisible();
  await expect(page.getByTestId('ignored-note')).toHaveText(
    'A4 vom Mikrofon ignoriert: MIDI hat Vorrang.',
    { timeout: 15_000 },
  );
  await expect(last).toHaveText('C4');

  // --- unplugging falls back to the microphone
  await page.evaluate(() =>
    (window as never as { __fakeMidi: { unplug(): void } }).__fakeMidi.unplug(),
  );
  await expect(page.getByText('Aktiv: Mikrofon')).toBeVisible();
  await expect(last).toHaveText(/^(C4|E4|G4|C5)$/, { timeout: 15_000 });
  await expect(source).toHaveText('Mikrofon');
  await page.getByRole('button', { name: 'Stoppen' }).click();
});

test('with a digital piano the first key starts the lesson; every note heard is shown', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.addInitScript(installFakeMidi);
  await signUpWithEmail(page, uniqueEmail('midistart'), 'Familie');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Mira');
  await page.getByRole('dialog').getByLabel('Geburtsjahr').fill('2016');
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await skipSetup(page);
  await page.getByRole('heading', { name: 'Hallo Mira!' }).waitFor();
  await page.goto('/input');
  await page.getByRole('button', { name: 'MIDI verbinden' }).click();
  await expect(page.getByText('Aktiv: MIDI (Klavio Test Piano)')).toBeVisible();

  // navigate inside the app (a reload would drop the test's MIDI device)
  await page.evaluate(() => {
    history.pushState({}, '', '/lesson/keys-c');
    dispatchEvent(new PopStateEvent('popstate'));
  });
  const skip = page.getByRole('button', { name: 'Überspringen' });
  const start = page.getByTestId('lesson-start');
  await expect(skip.or(start)).toBeVisible();
  if (await skip.isVisible()) await skip.click();
  // the start card says what to do: tap the button – or just play
  await expect(page.getByText(/oder spiel einfach eine Taste/)).toBeVisible();
  await midi(page, [0x90, 64, 100]);
  await midi(page, [0x80, 64, 0]);
  await expect(page.getByTestId('heard')).toBeVisible();
  // in the lesson: the note played shows up
  await midi(page, [0x90, 62, 100]);
  await expect(page.getByTestId('heard')).toHaveText('Ich höre: D');
  await audit(page);
});

test('chords: with a digital piano all three notes have to sound, on the screen one is enough', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.addInitScript(installFakeMidi);
  await signUpWithEmail(page, uniqueEmail('chords'), 'Familie');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Mira');
  await page.getByRole('dialog').getByLabel('Geburtsjahr').fill('2016');
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await skipSetup(page);
  await page.getByRole('heading', { name: 'Hallo Mira!' }).waitFor();
  const { LESSONS } = await import('@klavio/shared');
  await seedCompletedLessons(
    page,
    LESSONS.slice(
      0,
      LESSONS.findIndex((l) => l.id === 'accomp-chords'),
    ).map((l) => l.id),
  );

  // screen keys: one note of the chord is enough
  await page.goto('/lesson/accomp-chords');
  await skipTheory(page);
  await page.getByTestId('lesson-start-screen').click();
  await expect(page.getByText('Spiel den Akkord C').first()).toBeVisible();
  await audit(page);
  await page.getByRole('button', { name: 'E3', exact: true }).click();
  await expect(page.getByText('Spiel den Akkord F').first()).toBeVisible();

  // digital piano: one note is not enough, all three are
  await page.goto('/input');
  await page.getByRole('button', { name: 'MIDI verbinden' }).click();
  await expect(page.getByText('Aktiv: MIDI (Klavio Test Piano)')).toBeVisible();
  await page.evaluate(() => {
    history.pushState({}, '', '/lesson/accomp-chords');
    dispatchEvent(new PopStateEvent('popstate'));
  });
  const skip = page.getByRole('button', { name: 'Überspringen' });
  await expect(skip.or(page.getByTestId('lesson-start'))).toBeVisible();
  if (await skip.isVisible()) await skip.click();
  await expect(page.getByTestId('lesson-start')).toBeVisible();
  await midi(page, [0x90, 48, 100]); // starts the lesson
  await expect(page.getByText('Alle drei Töne zusammen drücken.')).toBeVisible();
  await midi(page, [0x80, 48, 0]);
  await midi(page, [0x90, 48, 100]);
  await page.waitForTimeout(400);
  await expect(page.getByText('Spiel den Akkord C').first()).toBeVisible();
  await midi(page, [0x90, 52, 100]);
  await midi(page, [0x90, 55, 100]);
  await expect(page.getByText('Spiel den Akkord F').first()).toBeVisible();
});

test('loud and soft and the pedal are checked with a digital piano', async ({ page }) => {
  test.setTimeout(90_000);
  await page.addInitScript(installFakeMidi);
  await signUpWithEmail(page, uniqueEmail('expr'), 'Familie');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Mira');
  await page.getByRole('dialog').getByLabel('Geburtsjahr').fill('2016');
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await skipSetup(page);
  await page.getByRole('heading', { name: 'Hallo Mira!' }).waitFor();
  const { LESSONS } = await import('@klavio/shared');
  await seedCompletedLessons(
    page,
    LESSONS.slice(
      0,
      LESSONS.findIndex((l) => l.id === 'expr-pedal'),
    ).map((l) => l.id),
  );
  await page.goto('/input');
  await page.getByRole('button', { name: 'MIDI verbinden' }).click();
  await expect(page.getByText('Aktiv: MIDI (Klavio Test Piano)')).toBeVisible();

  const open = async (id: string) => {
    await page.evaluate((path) => {
      history.pushState({}, '', path);
      dispatchEvent(new PopStateEvent('popstate'));
    }, `/lesson/${id}`);
    const skip = page.getByRole('button', { name: 'Überspringen' });
    await expect(skip.or(page.getByTestId('lesson-start'))).toBeVisible();
    if (await skip.isVisible()) await skip.click();
    await page.getByTestId('lesson-start').click();
  };

  // loud: a gentle C is not enough, a firm one is
  await open('expr-dynamics');
  await expect(page.getByText('Spiel das C laut').first()).toBeVisible();
  await midi(page, [0x90, 60, 40]);
  await expect(page.getByText('Noch kräftiger – das war zu leise.')).toBeVisible();
  await midi(page, [0x80, 60, 0]);
  await midi(page, [0x90, 60, 110]);
  await expect(page.getByText('Spiel das C leise').first()).toBeVisible();
  await audit(page);

  // pedal: first without, then with the pedal down
  await open('expr-pedal');
  await expect(page.getByText('Spiel das C mit Pedal').first()).toBeVisible();
  await midi(page, [0x90, 48, 90]);
  await expect(page.getByText('Drück zuerst das Pedal.')).toBeVisible();
  await midi(page, [0x80, 48, 0]);
  await midi(page, [0xb0, 64, 127]);
  await expect(page.getByTestId('pedal-state')).toHaveText('Pedal unten');
  await midi(page, [0x90, 48, 90]);
  await expect(page.getByText('Spiel das F mit Pedal').first()).toBeVisible();
  // the next note without lifting the pedal in between
  await midi(page, [0x90, 53, 90]);
  await expect(page.getByText(/Heb das Pedal zwischen den Tönen/)).toBeVisible();
  await midi(page, [0xb0, 64, 0]);
  await midi(page, [0xb0, 64, 127]);
  await midi(page, [0x90, 53, 90]);
  await expect(page.getByText('Spiel das G mit Pedal').first()).toBeVisible();
  await audit(page);
});
