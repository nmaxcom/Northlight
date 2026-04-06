import { describe, expect, it } from 'vitest';

import { shouldHideLauncherApp } from './dismissBehavior';

describe('shouldHideLauncherApp', () => {
  it('hides the app on macOS when no settings window is visible', () => {
    expect(shouldHideLauncherApp('darwin', false)).toBe(true);
  });

  it('does not hide the app on macOS when settings are visible', () => {
    expect(shouldHideLauncherApp('darwin', true)).toBe(false);
  });

  it('does not hide the app on non-mac platforms', () => {
    expect(shouldHideLauncherApp('linux', false)).toBe(false);
  });
});
