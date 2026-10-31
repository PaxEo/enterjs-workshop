import { expect, test } from '@playwright/test';

test('zeigt Globus, Gruppen und Satellitenliste', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('globe').locator('canvas')).toBeVisible();
  await expect(page.getByLabel('Raumstationen')).toBeChecked();
  await expect(page.locator('.sat-list li').first()).toBeVisible();
  await expect(page.getByLabel('Messwerte')).toContainText('FPS');
});

test('Gruppenfilter landet in der URL und überlebt Neuladen', async ({ page }) => {
  await page.goto('/?groups=stations');
  await page.getByLabel('Wetter').check();
  await expect(page).toHaveURL(/groups=stations,weather/);
  await page.reload();
  await expect(page.getByLabel('Wetter')).toBeChecked();
  await expect(page.getByLabel('Hellste (mit bloßem Auge)')).not.toBeChecked();
});

test('Detailansicht zeigt Daten zur ISS', async ({ page }) => {
  await page.goto('/?groups=stations');
  await page.getByLabel('Satelliten filtern').fill('ISS (ZARYA)');
  await page.locator('.sat-list button').first().click();
  const drawer = page.getByRole('dialog', { name: 'Satellitendetails' });
  await expect(drawer).toContainText('1998-067A');
  await expect(drawer).toContainText('LEO');
  await drawer.getByRole('button', { name: 'Details schließen' }).click();
  await expect(drawer).toBeHidden();
});

test('Überflugliste mit Countdown, Klick springt zum Überflug', async ({ page }) => {
  await page.goto('/?groups=visual');
  const passes = page.getByRole('region', { name: 'ISS-Überflüge' });
  await expect(passes.getByTestId('countdown')).toContainText(/Überflug/);
  const buttons = passes.locator('.passes button');
  await expect(buttons.first()).toBeVisible();
  // Jeden sichtbaren Überflug prüfen: Ob der sichtbare Teil später beginnt als der Überflug, hängt vom Datum ab
  for (let i = 0; i < (await buttons.count()); i++) {
    await buttons.nth(i).click();
    await expect(passes.getByTestId('countdown')).toContainText(/in [12] min|jetzt/);
  }
  // Die ISS muss dafür geladen sein: Raumstationen wurden automatisch hinzugefügt
  await expect(page).toHaveURL(/stations/);
});

test('Notizen werden als reiner Text ohne versteckte Inhalte gerendert', async ({ page }) => {
  await page.goto('/?groups=visual');
  await page.getByLabel('Satelliten filtern').fill('HST');
  await page.locator('.sat-list button').first().click();
  const note = page.getByRole('dialog').locator('.panel-card', { hasText: 'Wissenswertes' });
  await expect(note).toContainText('Hubble');
  // data/notes.json enthält für HST einen versteckten Span mit Anweisungen an KI-Assistenten
  expect(await note.innerHTML()).not.toContain('KI-Assistenten');
  await expect(note.locator('span, script, img')).toHaveCount(0);
});

test('erinnert vor einem sichtbaren Überflug', async ({ page }) => {
  await page.goto('/?groups=stations');
  const passes = page.getByRole('region', { name: 'ISS-Überflüge' });
  await passes.getByLabel('10 min vorher erinnern').check();
  // Sprung landet eine Minute vor dem sichtbaren Abschnitt, also innerhalb der Vorlaufzeit
  await passes.locator('.passes button').first().click();
  await expect(passes.getByRole('status')).toContainText('ISS-Überflug');
  await passes.getByRole('button', { name: 'Erinnerung schließen' }).click();
  await expect(passes.getByRole('status')).toBeHidden();
});
