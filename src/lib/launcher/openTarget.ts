type LauncherPlatform = string;

export type LauncherOpenStrategy =
  | { kind: 'open-app'; command: string; args: string[] }
  | { kind: 'open-path' };

export function getLauncherOpenStrategy(path: string, platform: LauncherPlatform): LauncherOpenStrategy {
  if (platform === 'darwin' && path.endsWith('.app')) {
    return {
      kind: 'open-app',
      command: 'open',
      args: ['-a', path]
    };
  }

  return { kind: 'open-path' };
}
