import { expect, test } from '@playwright/test';

test('keeps path completion suggestions visible across casing differences', async ({ page }) => {
  await page.goto('/');
  const input = page.getByLabel('Launcher query');

  await input.fill('/app');
  await expect(page.locator('[data-launcher-role="path-suggestion"]')).toContainText('/applications/');
  await page.keyboard.press('Tab');
  await expect(input).toHaveValue('/Applications/');
});

test('finds scoped results consistently with in: at the beginning and end', async ({ page }) => {
  await page.goto('/');
  const input = page.getByLabel('Launcher query');

  await input.fill('in:/Users/nm4/STUFF/Coding/Northlight product .md');
  await expect(page.getByRole('button', { name: /product-brief\.md/i })).toBeVisible();

  await input.fill('product .md in:/Users/nm4/STUFF/Coding/Northlight');
  await expect(page.getByRole('button', { name: /product-brief\.md/i })).toBeVisible();
});

test('finds dotfiles, hidden-library files, apps, and scoped images inside explicit paths', async ({ page }) => {
  await page.goto('/');
  const input = page.getByLabel('Launcher query');

  await input.fill('in:/Users/nm4/STUFF/Coding/Northlight .env');
  await expect(page.getByRole('button', { name: /\.env/i })).toBeVisible();

  await input.fill('ghost img in:/Users/nm4/Library/Application Support/HiddenGallery');
  await expect(page.getByRole('button', { name: /ghost-image\.png/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /session-cache\.json/i })).toHaveCount(0);

  await input.fill('textedit app in:/System/Applications');
  await expect(page.getByRole('button', { name: /TextEdit\.app/i })).toBeVisible();

  await input.fill('type in:/Users/nm4/Documents/Brand/steel-moodboard');
  await expect(page.getByRole('button', { name: /type-study\.sketch/i })).toBeVisible();

  await input.fill('type img in:/Users/nm4/Documents/Brand/steel-moodboard');
  await expect(page.getByRole('button', { name: /type-study\.sketch/i })).toHaveCount(0);
});

test('finds results in fast-path, indexed-only, and explicit non-hot paths', async ({ page }) => {
  await page.goto('/');
  const input = page.getByLabel('Launcher query');

  await input.fill('invoice .pdf in:desktop');
  await expect(page.getByRole('button', { name: /Invoice-April\.pdf/i })).toBeVisible();

  await input.fill('product .md in:/Users/nm4/STUFF/Coding/Northlight');
  await expect(page.getByRole('button', { name: /product-brief\.md/i })).toBeVisible();

  await input.fill('raycast .md in:/Users/nm4/Projects/Launchers');
  await expect(page.getByRole('button', { name: /Raycast-notes\.md/i })).toBeVisible();
});
