import { expect, test } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

function currentDesignExportUrl(): string {
  return pathToFileURL(resolve(process.cwd(), 'design', 'export', 'current-design.html')).href;
}

test('opens the exported current launcher design as a self-contained local file', async ({ page }) => {
  await page.goto(currentDesignExportUrl());

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
