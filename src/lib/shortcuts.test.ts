import { describe, expect, it } from 'vitest';
import { DEFAULT_LAUNCHER_SHORTCUT, resolveLauncherShortcut, shortcutTokens } from './shortcuts';

describe('shortcut helpers', () => {
  it('keeps an explicit shortcut unchanged', () => {
    expect(resolveLauncherShortcut('Alt+Space', false)).toBe('Alt+Space');
  });

  it('falls back to the default shortcut in development when none is persisted', () => {
    expect(resolveLauncherShortcut('', false)).toBe(DEFAULT_LAUNCHER_SHORTCUT);
  });

  it('keeps the shortcut disabled in packaged builds when none is persisted', () => {
    expect(resolveLauncherShortcut('', true)).toBe('');
  });

  it('breaks an accelerator into displayable Apple-style tokens', () => {
    expect(shortcutTokens('CommandOrControl+Shift+Space')).toEqual([
      { id: 'CommandOrControl-0', label: 'CommandOrControl', symbol: '⌘' },
      { id: 'Shift-1', label: 'Shift', symbol: '⇧' },
      { id: 'Space-2', label: 'Space', symbol: '␣' }
    ]);
  });
});
