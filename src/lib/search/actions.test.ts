import { describe, expect, it } from 'vitest';
import { buildLocalActionDescriptors } from './actions';

describe('buildLocalActionDescriptors', () => {
  it('builds stronger file actions including quick look and markdown copy', () => {
    const actions = buildLocalActionDescriptors({
      path: '/Users/nm4/Documents/spec.md',
      name: 'spec.md',
      kind: 'file'
    });

    expect(actions.map((action) => action.id)).toContain('quick-look');
    expect(actions.map((action) => action.id)).toContain('copy-markdown-link');
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
});
