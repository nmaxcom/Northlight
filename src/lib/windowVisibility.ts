export const LAUNCHER_BLUR_HIDE_SUPPRESSION_MS = 300;

export function createBlurSuppressionDeadline(now: number, duration = LAUNCHER_BLUR_HIDE_SUPPRESSION_MS) {
  return now + duration;
}

export function shouldHideLauncherOnBlur(isVisible: boolean, now: number, blurSuppressionDeadline: number) {
  return isVisible && now >= blurSuppressionDeadline;
}
