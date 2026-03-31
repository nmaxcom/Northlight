export const DEFAULT_LAUNCHER_SHORTCUT = 'CommandOrControl+Shift+Space';

type ShortcutToken = {
  id: string;
  label: string;
  symbol?: string;
};

const TOKEN_SYMBOLS: Record<string, string> = {
  CommandOrControl: '⌘',
  Control: '⌃',
  Alt: '⌥',
  Shift: '⇧',
  Escape: '⎋',
  Backspace: '⌫',
  Delete: '⌦',
  Enter: '↩',
  Return: '↩',
  Tab: '⇥',
  Space: '␣',
  Up: '↑',
  Down: '↓',
  Left: '←',
  Right: '→',
  ',': ','
};

export function resolveLauncherShortcut(accelerator: string | null | undefined, isPackaged: boolean) {
  const trimmed = accelerator?.trim() ?? '';

  if (trimmed) {
    return trimmed;
  }

  return isPackaged ? '' : DEFAULT_LAUNCHER_SHORTCUT;
}

export function shortcutTokens(accelerator: string | null | undefined): ShortcutToken[] {
  const trimmed = accelerator?.trim() ?? '';
  if (!trimmed) {
    return [];
  }

  return trimmed.split('+').map((part, index) => {
    const label = part.trim();
    return {
      id: `${label}-${index}`,
      label,
      symbol: TOKEN_SYMBOLS[label]
    };
  });
}
