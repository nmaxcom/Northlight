import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LAUNCHER_THEME_ID,
  getLauncherTheme,
  getNextLauncherThemeId,
  normalizeLauncherThemeId
} from './launcherTheme';

describe('launcherTheme', () => {
  it('falls back to the original theme for unknown ids', () => {
    expect(normalizeLauncherThemeId(undefined)).toBe(DEFAULT_LAUNCHER_THEME_ID);
    expect(normalizeLauncherThemeId('nope')).toBe(DEFAULT_LAUNCHER_THEME_ID);
    expect(getLauncherTheme('nope').id).toBe(DEFAULT_LAUNCHER_THEME_ID);
  });

  it('cycles between the original and sandbox themes', () => {
    expect(getNextLauncherThemeId('original')).toBe('sandbox');
    expect(getNextLauncherThemeId('sandbox')).toBe('original');
  });
});
