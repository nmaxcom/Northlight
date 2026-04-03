import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildLocalActionDescriptors, buildOpenSystemSettingsActionDescriptor, resolveActionDescriptor } from './actions';

describe('buildLocalActionDescriptors', () => {
  beforeEach(() => {
    window.launcher = undefined;
  });

  it('builds stronger file actions including quick look and markdown copy', () => {
    const actions = buildLocalActionDescriptors({
      path: '/Users/nm4/Documents/spec.md',
      name: 'spec.md',
      kind: 'file'
    });

    expect(actions.map((action) => action.id)).toContain('quick-look');
    expect(actions.map((action) => action.id)).toContain('copy-markdown-link');
    expect(actions.map((action) => action.id)).not.toContain('trash');
  });

  it('builds terminal action for folders only', () => {
    const folderActions = buildLocalActionDescriptors({
      path: '/Users/nm4/STUFF/Coding',
      name: 'Coding',
      kind: 'folder'
    });
    const appActions = buildLocalActionDescriptors({
      path: '/Applications/Google Chrome.app',
      name: 'Google Chrome.app',
      kind: 'app'
    });

    expect(folderActions.map((action) => action.id)).toContain('open-terminal');
    expect(appActions.map((action) => action.id)).not.toContain('open-terminal');
  });

  it('resolves macOS system settings actions through the dedicated runtime bridge', async () => {
    const openSystemSettings = vi.fn().mockResolvedValue(undefined);
    window.launcher = {
      openSystemSettings
    } as never;

    const action = resolveActionDescriptor(
      buildOpenSystemSettingsActionDescriptor('Open Keyboard Settings', 'x-apple.systempreferences:com.apple.Keyboard')
    );

    await action.run();

    expect(openSystemSettings).toHaveBeenCalledWith('x-apple.systempreferences:com.apple.Keyboard');
  });
});
