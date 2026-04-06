import { expect, test } from '@playwright/test';

test('shows launcher shell', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText(/northlight/i)).toBeVisible();
  await expect(page.getByPlaceholder('Search files, folders, apps, or type 30mph to kmh')).toBeVisible();
});

test('shows deterministic conversion answers', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Launcher query').fill('30mph to kmh');

  await expect(page.getByText('30 mi/h = 48.28 km/h').first()).toBeVisible();
  await expect(page.getByText('Copy Result').first()).toBeVisible();
});

test('shows extended deterministic calculations', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Launcher query').fill('15% of 240');
  await expect(page.getByText('15% of 240 = 36').first()).toBeVisible();

  await page.getByLabel('Launcher query').fill('45 usd to eur');
  await expect(page.getByText(/45 USD = .* EUR/).first()).toBeVisible();
});

test('shows local fixture results and keyboard action hints', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Launcher query').fill('product');

  await expect(page.getByRole('button', { name: /product-brief\.md/i })).toBeVisible();
  await expect(page.locator('footer').getByText('Open File')).toBeVisible();
  await expect(page.getByRole('button', { name: /actions cmd k/i })).toBeVisible();
});

test('supports fuzzy app matches and folder quick actions', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Launcher query').fill('btt');
  await expect(page.getByRole('button', { name: /BetterTouchTool\.app/i })).toBeVisible();

  await page.getByLabel('Launcher query').fill('steel');
  await page.keyboard.press('Meta+K');
  await expect(page.getByLabel('Action filter')).toBeVisible();
  const panel = page.locator('[data-actions-panel="true"]');
  await expect(panel.getByText('Open In Terminal')).toBeVisible();
  await expect(panel.getByText('Copy Name')).toBeVisible();
});

test('supports trailing intent refiners for folders and apps', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Launcher query').fill('steel/');
  await expect(page.getByRole('button', { name: /steel-moodboard/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /strategy-notes\.md/i })).toHaveCount(0);

  await page.getByLabel('Launcher query').fill('better app');
  await expect(page.getByRole('button', { name: /BetterTouchTool\.app/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /BetterBattery\.app/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Raycast-notes\.md/i })).toHaveCount(0);
});

test('keeps folder refiner chips compact without adding a large spacer row', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Launcher query').fill('steel/');

  const refinerChip = page.locator('[data-launcher-role="refiner-chip"]').first();
  const results = page.locator('[data-launcher-role="results"]');

  await expect(refinerChip).toBeVisible();
  await expect(results.getByRole('button', { name: /steel-moodboard/i })).toBeVisible();

  const chipBox = await refinerChip.boundingBox();
  const resultsBox = await results.boundingBox();

  expect(chipBox).not.toBeNull();
  expect(resultsBox).not.toBeNull();

  if (!chipBox || !resultsBox) {
    return;
  }

  expect(chipBox.height).toBeLessThan(40);
  expect(resultsBox.y - (chipBox.y + chipBox.height)).toBeLessThan(32);
});

test('filters actions inside the actions panel', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Launcher query').fill('product');
  await page.keyboard.press('Meta+K');

  const actionFilter = page.getByLabel('Action filter');
  await expect(actionFilter).toBeVisible();
  await actionFilter.fill('finder');

  const panel = page.locator('[data-actions-panel="true"]');
  await expect(panel.getByText('Reveal in Finder')).toBeVisible();
  await expect(panel.getByText('Copy Path')).toHaveCount(0);
});

test('shows the settings view route', async ({ page }) => {
  await page.goto('/?view=settings');

  await expect(page.getByText('Northlight Settings')).toBeVisible();
  await expect(page.getByRole('button', { name: /save settings/i })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Overview' })).toBeVisible();
  await expect(page.getByText('Search And Ranking')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Launcher shortcut' })).toBeVisible();
  await expect(page.getByText('⌘')).toBeVisible();
  await expect(page.getByText('⇧')).toBeVisible();
  await page.getByRole('button', { name: 'Scopes & Status' }).click();
  await expect(page.getByRole('checkbox', { name: /watch filesystem changes/i })).toBeChecked();
});

test('renders pane icons for Wi-Fi and Privacy settings commands', async ({ page }) => {
  await page.goto('/');

  const input = page.getByLabel('Launcher query');
  await input.fill('wifi');

  const wifiRow = page.getByRole('button', { name: /open wi-fi settings/i });
  await expect(wifiRow).toBeVisible();
  await expect(page.locator('[data-launcher-role="result"] img').first()).toHaveAttribute('src', /data:image\/svg\+xml/);

  await input.fill('privacy');

  const privacyRow = page.getByRole('button', { name: /open privacy & security settings/i });
  await expect(privacyRow).toBeVisible();
  await expect(page.locator('[data-launcher-role="result"] img').first()).toHaveAttribute('src', /data:image\/svg\+xml/);
});

test('removes the decorative tile behind image-backed icons', async ({ page }) => {
  await page.goto('/');

  const input = page.getByLabel('Launcher query');
  await input.fill('wifi');

  const imageBackedIcon = page.locator('[data-launcher-role="result-icon"]').first();
  await expect(imageBackedIcon).toBeVisible();
  await expect(imageBackedIcon).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(imageBackedIcon.locator('img')).toHaveCount(1);

  await input.fill('product');

  const glyphIcon = page.locator('[data-launcher-role="result-icon"]').first();
  await expect(glyphIcon).toBeVisible();
  await expect(glyphIcon).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(glyphIcon.locator('img')).toHaveCount(0);
});
