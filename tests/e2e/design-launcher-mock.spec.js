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

test('standalone launcher design pages use real Electron launcher sizes', async ({ page }) => {
  await page.goto(pathToFileURL(resolve('design/launcher-fresh-open-view.html')).href, { waitUntil: 'load' });

  const freshFrame = page.locator('main[title="Northlight launcher fresh open view"]');
  await expect(freshFrame).toHaveJSProperty('offsetWidth', 760);
  await expect(freshFrame).toHaveJSProperty('offsetHeight', 360);
  await expect(page.locator('[data-launcher-role="window"]')).toHaveAttribute('data-launcher-compact', 'true');
  await expect(page.locator('[data-launcher-role="search-input"]')).toHaveValue('');
  await expect(page.getByRole('button', { name: /Stremio\.app/i })).toBeVisible();
  await expect(page.locator('[data-launcher-role="preview-pane"]')).toHaveCount(0);

  await page.goto(pathToFileURL(resolve('design/launcher-results-view.html')).href, { waitUntil: 'load' });

  const resultsFrame = page.locator('main[title="Northlight launcher results view"]');
  await expect(resultsFrame).toHaveJSProperty('offsetWidth', 1120);
  await expect(resultsFrame).toHaveJSProperty('offsetHeight', 760);
  await expect(page.locator('[data-launcher-role="window"]')).toHaveAttribute('data-launcher-compact', 'false');
  await expect(page.locator('[data-launcher-role="search-input"]')).toHaveValue('str');
  await expect(page.locator('[data-launcher-role="preview-pane"]')).toBeVisible();
});
