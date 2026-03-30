import { describe, expect, it } from 'vitest';
import {
  createBlurSuppressionDeadline,
  DEFAULT_LAUNCHER_SHORTCUT,
  LAUNCHER_BLUR_HIDE_SUPPRESSION_MS,
  resolveLauncherShortcut,
  shouldHideLauncherOnBlur
} from './windowVisibility';

describe('window visibility helpers', () => {
  it('creates a blur suppression deadline from now', () => {
    expect(createBlurSuppressionDeadline(1_000)).toBe(1_000 + LAUNCHER_BLUR_HIDE_SUPPRESSION_MS);
    expect(createBlurSuppressionDeadline(1_000, 50)).toBe(1_050);
  });

  it('keeps the launcher visible while the blur suppression window is active', () => {
    expect(shouldHideLauncherOnBlur(true, 1_100, 1_200)).toBe(false);
  });

  it('hides the launcher once the suppression window has elapsed', () => {
    expect(shouldHideLauncherOnBlur(true, 1_200, 1_200)).toBe(true);
  });

  it('does not hide a launcher that is already not visible', () => {
    expect(shouldHideLauncherOnBlur(false, 1_500, 1_200)).toBe(false);
  });

  it('keeps an explicit shortcut unchanged', () => {
    expect(resolveLauncherShortcut('Alt+Space', false)).toBe('Alt+Space');
  });

  it('falls back to the default shortcut in development when none is persisted', () => {
    expect(resolveLauncherShortcut('', false)).toBe(DEFAULT_LAUNCHER_SHORTCUT);
  });

  it('keeps the shortcut disabled in packaged builds when none is persisted', () => {
    expect(resolveLauncherShortcut('', true)).toBe('');
  });
});
