import { _electron as electron, expect, test } from '@playwright/test';
import { resolve } from 'node:path';

test('electron settings window opens with visible settings content', async () => {
  const electronApp = await electron.launch({
    args: [resolve(process.cwd(), 'dist-electron/main/main.js')],
    env: {
      ...process.env,
      NORTHLIGHT_DEV: '1',
      NORTHLIGHT_DEV_INSTANCE: 'Settings E2E'
    }
  });

  try {
    const launcherWindow = await electronApp.firstWindow();
    await launcherWindow.waitForLoadState('domcontentloaded');

    const settingsWindowPromise = electronApp.waitForEvent('window');
    await launcherWindow.evaluate(async () => {
      await window.launcher?.openSettings?.();
    });
    const settingsWindow = await settingsWindowPromise;

    await settingsWindow.waitForLoadState('domcontentloaded');
    await expect(settingsWindow.getByText('Northlight Settings')).toBeVisible();
    await expect(settingsWindow.getByRole('tab', { name: 'Overview' })).toBeVisible();
  } finally {
    await electronApp.close();
  }
});
