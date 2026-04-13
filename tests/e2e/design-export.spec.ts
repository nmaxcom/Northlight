import { expect, test } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

function localDesignExportUrl(pageName: string): string {
  return pathToFileURL(resolve(process.cwd(), 'design', 'export', pageName)).href;
}

test('opens the exported launcher design as a self-contained local file', async ({ page }) => {
  await page.goto(localDesignExportUrl('launcher-current-view.html'));

  const reviewFrame = page.locator('main[title="Northlight launcher current view"]');
  await expect(reviewFrame).toBeVisible();
  await expect(page.getByText('Exact launcher viewport: 1120×760.')).toBeVisible();
  await expect(page.locator('[data-launcher-role="theme-switch-value"]')).toHaveText('Sandbox');
  await expect(page.locator('[data-launcher-role="search-input"]')).toHaveValue('str');

  const frameBox = await reviewFrame.boundingBox();
  expect(frameBox).not.toBeNull();
  if (frameBox) {
    expect(Math.round(frameBox.width)).toBe(1120);
    expect(Math.round(frameBox.height)).toBe(760);
  }
});

test('opens the exported settings design as a self-contained local file', async ({ page }) => {
  await page.goto(localDesignExportUrl('settings-current-view.html'));

  const reviewFrame = page.locator('main[title="Northlight settings current view"]');
  const tabs = page.locator('[data-settings-role="tabs"]');
  await expect(reviewFrame).toBeVisible();
  await expect(page.getByText('Exact settings viewport: 980×760.')).toBeVisible();
  await expect(tabs).toBeVisible();

  const frameBox = await reviewFrame.boundingBox();
  expect(frameBox).not.toBeNull();
  if (frameBox) {
    expect(Math.round(frameBox.width)).toBe(980);
    expect(Math.round(frameBox.height)).toBe(760);
  }
});
