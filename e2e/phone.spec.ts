import { expect, test } from '@playwright/test';
import { signUpWithEmail, skipTheory, uniqueEmail, skipSetup } from './helpers';
import { audit } from './audit';

// a phone: narrow, touch only
test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  userAgent:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36',
});

test('on a phone the keys are big enough, move by an octave, a swipe scrolls and only a tap plays', async ({
  page,
}) => {
  test.setTimeout(90_000);
  // no MIDI, microphone denied → the on-screen keyboard
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, 'requestMIDIAccess', { value: undefined });
    navigator.mediaDevices.getUserMedia = () =>
      Promise.reject(new DOMException('denied', 'NotAllowedError'));
  });
  await signUpWithEmail(page, uniqueEmail('phone'), 'Familie');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Lina');
  await page.getByRole('dialog').getByLabel('Geburtsjahr').fill('2018');
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await skipSetup(page);
  await page.getByRole('heading', { name: 'Hallo Lina!' }).waitFor();

  await page.goto('/lesson/keys-c');
  await skipTheory(page);
  await page.getByTestId('lesson-start').click();
  const c4 = page.getByRole('button', { name: 'C4', exact: true });
  await expect(c4).toBeVisible();

  // finger-sized keys: only those that fit, nothing to swipe sideways …
  const box = (await c4.boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(34);
  // the keyboard stays in reach at the bottom of the screen
  expect(box.y + box.height).toBeLessThanOrEqual(844);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  // … the others an octave away
  await expect(page.getByRole('button', { name: 'C5', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Tasten eine Oktave höher' }).click();
  await expect(page.getByRole('button', { name: 'C5', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Tasten eine Oktave tiefer' }).click();
  await expect(c4).toBeVisible();
  await audit(page);

  // a swipe that starts on a key is a scroll, not a note
  const d4 = (await page.getByRole('button', { name: 'D4', exact: true }).boundingBox())!;
  const cdp = await page.context().newCDPSession(page);
  const at = (x: number, y: number) => [{ x, y, id: 1 }];
  const sx = d4.x + d4.width / 2;
  const sy = d4.y + d4.height * 0.8;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: at(sx, sy) });
  for (let i = 1; i <= 6; i++) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: at(sx, sy - i * 25),
    });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(300);
  await expect(page.getByText(/Das war/)).toHaveCount(0);
  await expect(page.getByText('Richtig!')).toHaveCount(0);

  // a tap plays
  const asked = /Finde das (\S+)/.exec((await page.getByTestId('prompt').textContent()) ?? '')![1]!;
  const target = page.getByRole('button', { name: `${asked}4`, exact: true });
  const t = (await target.boundingBox())!;
  await page.touchscreen.tap(t.x + t.width / 2, t.y + t.height * 0.85);
  await expect(page.getByText(/^Aufgabe 2 von/)).toBeVisible();
});

test('the avatar menu opens on the screen, also when scrolled down', async ({ page }) => {
  test.setTimeout(90_000);
  await page.addInitScript(() => localStorage.setItem('klavio.installHint.dismissed', 'true'));
  await signUpWithEmail(page, uniqueEmail('phonemenu'), 'Familie');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Olli');
  await page.getByRole('dialog').getByLabel('Geburtsjahr').fill('2017');
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await skipSetup(page);
  await page.getByRole('heading', { name: 'Hallo Olli!' }).waitFor();
  await page.evaluate(() => window.scrollTo(0, 800));
  await page.getByRole('button', { name: 'Menü' }).tap();
  const menu = page.getByRole('menu');
  await expect(menu).toBeVisible();
  const box = (await menu.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(390);
  // the page did not get wider (it would jump sideways)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});
