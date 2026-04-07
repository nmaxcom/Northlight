import { expect, test } from '@playwright/test';

test('keeps Calendar.app visible for direct calendar queries', async ({ page }) => {
  await page.goto('/');
  const input = page.getByLabel('Launcher query');
  await input.fill('calendar');

  await expect(page.getByRole('button', { name: /Calendar\.app/i })).toBeVisible();
});
