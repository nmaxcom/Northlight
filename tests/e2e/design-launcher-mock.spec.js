import { expect, test } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

test('standalone launcher design mock updates preview on hover', async ({ page }) => {
  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });
  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  const fileUrl = pathToFileURL(resolve('design/launcher-current-view.html')).href;
  await page.goto(fileUrl, { waitUntil: 'load' });

  await expect(page.locator('[data-launcher-role="preview-title"]')).toHaveText('Stremio');
  await expect(page.locator('[data-launcher-role="footer-primary-text"]')).toHaveText('Launch App');

  await page.locator('[data-result-id="strace-folder"]').hover();
  await expect(page.locator('[data-launcher-role="preview-title"]')).toHaveText('strace');
  await expect(page.locator('[data-launcher-role="preview-meta-value"]').first()).toHaveText('Folder');
  await expect(page.locator('[data-launcher-role="footer-primary-text"]')).toHaveText('Open Folder');

  await page.locator('[data-result-id="keyboard-maestro-app"]').hover();
  await expect(page.locator('[data-launcher-role="preview-title"]')).toHaveText('Keyboard Maestro');
  await expect(page.locator('[data-launcher-role="preview-media-image"]')).toBeVisible();

  await page.locator('[data-result-id="stripe-folder"]').hover();
  await expect(page.locator('[data-launcher-role="preview-title"]')).toHaveText('stripe');
  await expect(page.locator('[data-launcher-role="preview-body"]')).toContainText('README.md');
  await expect(page.locator('[data-launcher-role="footer-primary-text"]')).toHaveText('Open Folder');

  await page.locator('[data-result-id="string-cmp"]').hover();
  await expect(page.locator('[data-launcher-role="preview-title"]')).toHaveText('string_cmp.h');
  await expect(page.locator('[data-launcher-role="preview-body"]')).toContainText('GitStatus');
  await expect(page.locator('[data-launcher-role="footer-primary-text"]')).toHaveText('Open File');

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});
