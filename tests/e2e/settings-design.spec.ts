import { expect, test } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

function localDesignUrl(pageName: string): string {
  return pathToFileURL(resolve(process.cwd(), 'design', pageName)).href;
}

test('settings current design page mounts the real shipping settings view at native size', async ({ page }) => {
  await page.goto(localDesignUrl('settings-current-view.html'));

  const frame = page.locator('main.frame[data-design-shell="settings"]');
  await expect(frame).toHaveCSS('width', '980px');
  await expect(frame).toHaveCSS('height', '760px');

  await expect(page.getByText('Northlight Settings')).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Aliases & Snippets' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Scopes & Status' })).toBeVisible();
  await expect(page.locator('[data-settings-role="titlebar"]')).toBeVisible();
});
