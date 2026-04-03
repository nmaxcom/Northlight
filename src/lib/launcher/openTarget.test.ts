import { describe, expect, it } from 'vitest';

import { getLauncherOpenStrategy } from './openTarget';

describe('getLauncherOpenStrategy', () => {
  it('uses open -a for app bundles on macOS', () => {
    expect(getLauncherOpenStrategy('/Applications/Google Chrome.app', 'darwin')).toEqual({
      kind: 'open-app',
      command: 'open',
      args: ['-a', '/Applications/Google Chrome.app']
    });
  });

  it('uses shell openPath for non-app files on macOS', () => {
    expect(getLauncherOpenStrategy('/Users/nm4/Documents/ideas.md', 'darwin')).toEqual({
      kind: 'open-path'
    });
  });

  it('uses shell openPath for app bundles on non-mac platforms', () => {
    expect(getLauncherOpenStrategy('/Applications/Google Chrome.app', 'linux')).toEqual({
      kind: 'open-path'
    });
  });
});
