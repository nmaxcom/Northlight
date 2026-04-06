export function shouldHideLauncherApp(platform: string, hasVisibleSettingsWindow: boolean) {
  return platform === 'darwin' && !hasVisibleSettingsWindow;
}
