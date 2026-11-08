import { expect, test, type Page } from '@playwright/test';
import { addVirtualAuthenticator, signUpWithEmail, uniqueEmail } from './helpers';
import { audit } from './audit';

/** Types into a Mantine PinInput (first box focused → digits move on by themselves). */
async function typePin(page: Page, scope: ReturnType<Page['locator']>, pin: string) {
  await scope.locator('input').first().click();
  await page.keyboard.type(pin);
}

test('account name and parent PIN protect the parent area', async ({ page }) => {
  test.setTimeout(90_000);
  await signUpWithEmail(page, uniqueEmail('parent'), 'Familie Muster');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Lina');
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await expect(page.getByRole('heading', { name: 'Hallo Lina!' })).toBeVisible();

  // --- right after login the parent area is open: rename the account, set a PIN
  await page.goto('/account');
  await expect(page.getByTestId('account-name')).toHaveText('Familie Muster');
  await page.getByRole('button', { name: 'Name ändern' }).click();
  await page.getByLabel('Name des Kontos').fill('Familie Huber');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(page.getByTestId('account-name')).toHaveText('Familie Huber');

  await page.getByRole('button', { name: 'PIN festlegen' }).click();
  const pinCard = page
    .locator('div')
    .filter({ has: page.getByRole('heading', { name: 'Elternbereich' }) })
    .last();
  await typePin(page, pinCard, '2468');
  await page.getByRole('button', { name: 'Weiter' }).click();
  await typePin(page, pinCard, '2468');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(page.getByText('Die Eltern-PIN ist eingerichtet.')).toBeVisible();
  await audit(page);

  // --- handing the device to the child locks the parent area
  await page.goto('/profiles');
  await page.getByRole('button', { name: 'Lina' }).click();
  await expect(page.getByRole('heading', { name: 'Hallo Lina!' })).toBeVisible();
  await page.getByRole('button', { name: 'Menü' }).click();
  await page.getByRole('menuitem', { name: 'Konto' }).click();
  await expect(page.getByText('Gib die Eltern-PIN ein.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Passkeys' })).toHaveCount(0);
  await audit(page);

  await typePin(page, page.locator('form'), '1357');
  await expect(page.getByText('Die PIN stimmt nicht.')).toBeVisible();
  await typePin(page, page.locator('form'), '2468');
  await expect(page.getByRole('heading', { name: 'Passkeys' })).toBeVisible();

  // --- adding a profile while locked asks for the PIN first
  await page.getByRole('button', { name: 'Jetzt sperren' }).click();
  await expect(page.getByRole('heading', { name: 'Wer spielt heute?' })).toBeVisible();
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  const dialog = page.getByRole('dialog', { name: 'Elternbereich' });
  await expect(dialog).toBeVisible();
  await typePin(page, dialog, '2468');
  await expect(page.getByRole('dialog', { name: 'Neues Profil' })).toBeVisible();

  // --- the child may pick a new figure in "Mein Profil" while the parent area is locked
  await page
    .getByRole('dialog', { name: 'Neues Profil' })
    .getByRole('button', { name: 'Abbrechen' })
    .click();
  await page.getByRole('button', { name: 'Lina' }).click();
  await page.getByRole('button', { name: 'Menü' }).click();
  await page.getByRole('menuitem', { name: 'Mein Profil' }).click();
  await expect(page.getByText('Deine Figur kannst du selbst wählen.')).toBeVisible();
  await expect(page.getByLabel('Name')).toBeDisabled();
  await page.getByRole('radio', { name: 'Quaki, der Frosch' }).click();
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(page.getByText('Profil gespeichert.')).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Quaki, der Frosch' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(page.getByRole('button', { name: 'Profil löschen' })).toHaveCount(0);
  await audit(page);
});

test('the input setup belongs to the parent area; a passkey can open it instead of the PIN', async ({
  page,
  context,
}) => {
  test.setTimeout(90_000);
  await addVirtualAuthenticator(context, page);
  await signUpWithEmail(page, uniqueEmail('parentkey'), 'Familie Schlüssel');
  await page.getByRole('button', { name: 'Profil hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Tim');
  await page.getByRole('button', { name: 'Profil erstellen' }).click();
  await expect(page.getByRole('heading', { name: 'Hallo Tim!' })).toBeVisible();

  // parent: a passkey, a PIN, and the passkey switch
  await page.goto('/account');
  await page.getByRole('button', { name: 'Passkey hinzufügen' }).click();
  await expect(page.getByRole('button', { name: /^Löschen:/ })).toHaveCount(1);
  await page.getByRole('button', { name: 'PIN festlegen' }).click();
  const pinCard = page
    .locator('div')
    .filter({ has: page.getByRole('heading', { name: 'Elternbereich' }) })
    .last();
  await typePin(page, pinCard, '1212');
  await page.getByRole('button', { name: 'Weiter' }).click();
  await typePin(page, pinCard, '1212');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  const toggle = page.getByRole('switch', { name: 'Elternbereich auch mit Passkey öffnen' });
  await expect(toggle).not.toBeChecked();
  await toggle.click({ force: true });
  await expect(toggle).toBeChecked();
  await audit(page);

  // the child: the input setup asks for the parents
  await page.getByRole('button', { name: 'Jetzt sperren' }).click();
  await page.getByRole('button', { name: 'Tim' }).click();
  await page.goto('/input');
  await expect(page.getByText('Gib die Eltern-PIN ein.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Wie spielst du?' })).toHaveCount(0);

  // a parent opens it with the passkey
  await page.getByRole('button', { name: 'Mit Passkey öffnen' }).click();
  await expect(page.getByRole('heading', { name: 'Wie spielst du?' })).toBeVisible();
});
