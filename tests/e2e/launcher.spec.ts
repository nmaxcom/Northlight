import { expect, test } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

function localDesignUrl(pageName: string): string {
  return pathToFileURL(resolve(process.cwd(), 'design', pageName)).href;
}

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
  await expect(page.locator('[data-launcher-role="actions-trigger"]')).toBeVisible();
  await expect(page.locator('[data-launcher-role="actions-trigger"]')).toContainText('Actions');
  await expect(page.locator('[data-launcher-role="actions-trigger"]')).toContainText('⌘');
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

test('completes paths with Tab and reuses saved path aliases inside in:', async ({ page }) => {
  await page.goto('/');
  const input = page.getByLabel('Launcher query');

  await input.fill('/Users/nm4/ST');
  await page.keyboard.press('Tab');
  await expect(input).toHaveValue('/Users/nm4/STUFF/');

  await input.fill('/Users/nm4/STUFF/Coding/Northlight/');
  await page.keyboard.press('Meta+K');
  await expect(page.getByLabel('Path alias name')).toBeVisible();
  await page.getByLabel('Path alias name').fill('Northlight');
  await page.getByRole('button', { name: 'Save Path Alias' }).click();

  await input.fill('in:nor');
  await page.keyboard.press('Tab');
  await expect(input).toHaveValue('in:Northlight');
});

test('renders a compact path completion panel with separate active detail', async ({ page }) => {
  await page.goto('/');
  const input = page.getByLabel('Launcher query');

  await input.fill('/Users/nm4/');

  const panel = page.locator('[data-launcher-role="path-completion-list"]');
  const firstRow = page.locator('[data-launcher-role="path-completion-row"]').first();
  const activeDetail = page.locator('[data-launcher-role="path-completion-active-detail"]');

  await expect(panel).toBeVisible();
  await expect(firstRow).toBeVisible();
  await expect(panel.getByText('Folder')).toHaveCount(0);
  await expect(panel.getByText('Alias')).toHaveCount(0);
  await expect(activeDetail).toBeVisible();

  const rowBox = await firstRow.boundingBox();
  expect(rowBox).not.toBeNull();
  if (!rowBox) {
    return;
  }

  expect(rowBox.height).toBeLessThan(42);
});

test('surfaces common system apps from the fast tier without empty intermediate state', async ({ page }) => {
  await page.goto('/');
  const input = page.getByLabel('Launcher query');
  await input.fill('textedit');

  await expect(page.getByRole('button', { name: /TextEdit\.app/i })).toBeVisible();
  await expect(page.getByText('No matching result')).toHaveCount(0);
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

test('shows refiner chips inside the search box without extra status badges or spacer rows', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Launcher query').fill('steel/');

  await expect(page.getByText(/^hybrid$/i)).toHaveCount(0);
  await expect(page.getByText(/^catalog ready$/i)).toHaveCount(0);

  const search = page.locator('[data-launcher-role="search"]');
  const refinerChip = page.locator('[data-launcher-role="refiner-chip"]').first();
  const results = page.locator('[data-launcher-role="results"]');
  const versionBadge = page.locator('[data-launcher-role="status-badge"]').first();

  await expect(refinerChip).toBeVisible();
  await expect(results.getByRole('button', { name: /steel-moodboard/i })).toBeVisible();
  await expect(versionBadge).toHaveText(/^v\d+\.\d+\.\d+$/);

  const searchBox = await search.boundingBox();
  const chipBox = await refinerChip.boundingBox();
  const resultsBox = await results.boundingBox();

  expect(searchBox).not.toBeNull();
  expect(chipBox).not.toBeNull();
  expect(resultsBox).not.toBeNull();

  if (!searchBox || !chipBox || !resultsBox) {
    return;
  }

  expect(chipBox.height).toBeLessThan(40);
  expect(chipBox.y).toBeGreaterThanOrEqual(searchBox.y);
  expect(chipBox.y + chipBox.height).toBeLessThanOrEqual(searchBox.y + searchBox.height);
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

  await expect(page.locator('[data-settings-role="header-copy"]')).toContainText('Settings');
  await expect(page.getByRole('button', { name: /save settings/i })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible();
  await expect(page.getByText('Search', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Launcher shortcut' })).toBeVisible();
  await expect(page.getByText('⌘')).toBeVisible();
  await expect(page.getByText('⇧')).toBeVisible();
  await page.getByRole('tab', { name: 'Scopes & Status' }).click();
  await expect(page.getByRole('checkbox', { name: /watch filesystem for changes/i })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: /fast path/i }).first()).toBeVisible();
  await expect(page.getByText('Latency (local samples)')).toBeVisible();
  await expect(page.getByText('Scope reference')).toBeVisible();
});

test('keeps settings tabs outside the content scroll region', async ({ page }) => {
  await page.goto('/?view=settings');

  const tabs = page.locator('[data-settings-role="tabs"]');
  const content = page.locator('[data-settings-role="content"]');

  await expect(tabs).toBeVisible();
  await expect(content).toBeVisible();

  await page.getByRole('tab', { name: 'Scopes & Status' }).click();

  const before = await tabs.boundingBox();
  expect(before).not.toBeNull();

  await content.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });

  const after = await tabs.boundingBox();
  expect(after).not.toBeNull();

  if (!before || !after) {
    return;
  }

  expect(after.y).toBe(before.y);
});

test('shows the shared settings v3 mockup with persistent sidebar and refreshed controls', async ({ page }) => {
  await page.goto(localDesignUrl('settings-current-view3.html'));

  const reviewFrame = page.locator('main[title="Northlight settings current view v3"]');
  await expect(page.getByText(/980×760/i)).toBeVisible();
  const tabs = page.locator('[data-settings-role="tabs"]');
  const content = page.locator('[data-settings-role="content"]');
  const primaryButton = page.locator('[data-settings-role="primary-button"]');
  const titlebar = page.locator('[data-settings-role="titlebar"]');
  const header = page.locator('[data-settings-role="header"]');

  await expect(reviewFrame).toBeVisible();
  await expect(tabs).toBeVisible();
  await expect(content).toBeVisible();
  await expect(primaryButton).toBeVisible();
  await expect(titlebar).toBeVisible();
  await expect(primaryButton).toHaveCSS('border-top-left-radius', '12px');
  await expect(primaryButton).toHaveCSS('min-height', '38px');
  await expect(titlebar).toHaveCSS('-webkit-app-region', 'drag');
  await expect(header).toHaveCSS('-webkit-app-region', 'no-drag');

  const frameBox = await reviewFrame.boundingBox();
  expect(frameBox).not.toBeNull();
  if (frameBox) {
    expect(Math.round(frameBox.width)).toBe(980);
    expect(Math.round(frameBox.height)).toBe(760);
  }

  const before = await tabs.boundingBox();
  expect(before).not.toBeNull();

  await page.getByRole('tab', { name: 'Scopes & Status' }).click();
  await content.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });

  const after = await tabs.boundingBox();
  expect(after).not.toBeNull();

  if (!before || !after) {
    return;
  }

  expect(after.y).toBe(before.y);
});

test('shows the launcher design mockup on a black review background with a realistic populated state', async ({ page }) => {
  await page.goto(localDesignUrl('launcher-current-view.html'));

  const reviewFrame = page.locator('main[title="Northlight launcher current view"]');
  await expect(reviewFrame).toBeVisible();
  await expect(page.getByText('Exact launcher viewport: 1120×760.')).toBeVisible();
  await expect(page.locator('[data-launcher-role="theme-switch-value"]')).toHaveText('Sandbox');
  await expect(page.locator('[data-launcher-role="window"]')).toHaveCSS('border-top-color', 'rgba(106, 123, 255, 0.35)');
  await expect(page.locator('[data-launcher-role="status-badge"]').nth(1)).toHaveText(/\d{1,3}(,\d{3})* indexed/);
  await expect(page.getByText(/^hybrid$/i)).toHaveCount(0);
  await expect(page.getByText(/^catalog ready$/i)).toHaveCount(0);
  await expect(page.locator('[data-launcher-role="search-input"]')).toHaveValue('str');
  await expect(page.getByRole('button', { name: /Stremio\.app/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Keyboard Maestro\.app/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /strace\.md/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /strings\.cc/i })).toBeVisible();
  await expect(page.locator('[data-launcher-role="result"]').filter({ hasText: 'stripe' }).first()).toBeVisible();
  await expect(page.locator('[data-launcher-role="preview-title"]')).toHaveText('Stremio');
  await expect(page.locator('[data-launcher-role="preview-subtitle"]')).toHaveText('/Applications/Stremio.app');
  await expect(page.locator('[data-launcher-role="preview-body"]')).toHaveCount(0);
  await expect(page.locator('[data-launcher-role="preview-meta-value"]').filter({ hasText: '5.1.14' })).toBeVisible();

  const resultCount = await page.locator('[data-launcher-role="result"]').count();
  const iconImageCount = await page.locator('[data-launcher-role="result-icon-image"]').count();
  expect(resultCount).toBeGreaterThanOrEqual(8);
  expect(iconImageCount).toBeGreaterThanOrEqual(8);

  const frameBox = await reviewFrame.boundingBox();
  expect(frameBox).not.toBeNull();
  if (frameBox) {
    expect(Math.round(frameBox.width)).toBe(1120);
    expect(Math.round(frameBox.height)).toBe(760);
  }
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
