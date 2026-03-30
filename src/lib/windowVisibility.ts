export const LAUNCHER_BLUR_HIDE_SUPPRESSION_MS = 300;
export const DEFAULT_LAUNCHER_SHORTCUT = 'CommandOrControl+Shift+Space';

export function createBlurSuppressionDeadline(now: number, duration = LAUNCHER_BLUR_HIDE_SUPPRESSION_MS) {
  return now + duration;
}

export function shouldHideLauncherOnBlur(isVisible: boolean, now: number, blurSuppressionDeadline: number) {
  return isVisible && now >= blurSuppressionDeadline;
}

export function resolveLauncherShortcut(accelerator: string | null | undefined, isPackaged: boolean) {
  const trimmed = accelerator?.trim() ?? '';

  if (trimmed) {
    return trimmed;
  }

  return isPackaged ? '' : DEFAULT_LAUNCHER_SHORTCUT;
}
