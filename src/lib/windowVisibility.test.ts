import { describe, expect, it } from 'vitest';
import { createBlurSuppressionDeadline, LAUNCHER_BLUR_HIDE_SUPPRESSION_MS, shouldHideLauncherOnBlur } from './windowVisibility';

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
});
