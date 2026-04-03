import type { CSSProperties } from 'react';

export type LauncherThemeId = 'original' | 'sandbox';

type LauncherThemeDefinition = {
  id: LauncherThemeId;
  label: string;
  cssVariables: Record<`--${string}`, string>;
};

export const DEFAULT_LAUNCHER_THEME_ID: LauncherThemeId = 'original';

const originalThemeCssVariables: Record<`--${string}`, string> = {
  '--launcher-window-border': 'rgba(170, 192, 214, 0.26)',
  '--launcher-window-highlight': 'rgba(255, 255, 255, 0.02)',
  '--launcher-window-shadow': 'rgba(0, 0, 0, 0.34)',
  '--launcher-window-bg': 'radial-gradient(circle at top left, rgba(115, 142, 168, 0.16), transparent 32%), linear-gradient(180deg, rgba(11, 17, 23, 0.98), rgba(7, 10, 14, 0.995))',
  '--launcher-text': '#f5f7fa',
  '--launcher-muted-text': 'rgba(245, 247, 250, 0.54)',
  '--launcher-subtle-text': 'rgba(245, 247, 250, 0.46)',
  '--launcher-badge-bg': '#1d2732',
  '--launcher-badge-fg': '#d9e2ea',
  '--launcher-ready-badge-bg': '#163722',
  '--launcher-ready-badge-fg': '#8ade92',
  '--launcher-search-border': 'rgba(128, 151, 176, 0.3)',
  '--launcher-search-bg': 'rgba(255, 255, 255, 0.042)',
  '--launcher-search-highlight': 'rgba(255, 255, 255, 0.02)',
  '--launcher-search-shadow': 'rgba(0, 0, 0, 0.16)',
  '--launcher-search-icon': 'rgba(255, 255, 255, 0.72)',
  '--launcher-search-placeholder': 'rgba(255, 255, 255, 0.4)',
  '--launcher-refiner-border': 'rgba(128, 151, 176, 0.22)',
  '--launcher-refiner-bg': 'rgba(112, 132, 154, 0.12)',
  '--launcher-refiner-fg': 'rgba(232, 239, 245, 0.9)',
  '--launcher-best-match-bg': 'linear-gradient(180deg, rgba(50, 66, 84, 0.38), rgba(19, 26, 34, 0.66))',
  '--launcher-best-match-border': 'rgba(141, 167, 191, 0.34)',
  '--launcher-best-match-selected-ring': 'rgba(206, 222, 237, 0.12)',
  '--launcher-inline-chip-border': 'rgba(170, 192, 214, 0.14)',
  '--launcher-inline-chip-bg': 'rgba(255, 255, 255, 0.04)',
  '--launcher-scroll-thumb': 'rgba(171, 190, 208, 0.22)',
  '--launcher-empty-border': 'rgba(255, 255, 255, 0.08)',
  '--launcher-empty-bg': 'rgba(255, 255, 255, 0.028)',
  '--launcher-result-bg': 'rgba(255, 255, 255, 0.03)',
  '--launcher-result-hover-border': 'rgba(143, 165, 189, 0.32)',
  '--launcher-result-hover-bg': 'linear-gradient(180deg, rgba(54, 69, 84, 0.28), rgba(22, 29, 37, 0.5))',
  '--launcher-result-icon-fg': '#d9e2ea',
  '--launcher-result-icon-emboss': 'rgba(255, 255, 255, 0.06)',
  '--launcher-result-icon-asset-bg': 'rgba(255, 255, 255, 0.05)',
  '--launcher-icon-folder-bg': 'linear-gradient(180deg, rgba(84, 141, 206, 0.34), rgba(53, 87, 123, 0.54))',
  '--launcher-icon-app-bg': 'linear-gradient(180deg, rgba(66, 156, 120, 0.34), rgba(31, 97, 72, 0.56))',
  '--launcher-icon-file-bg': 'linear-gradient(180deg, rgba(130, 140, 152, 0.3), rgba(72, 81, 90, 0.48))',
  '--launcher-icon-conversion-bg': 'linear-gradient(180deg, rgba(183, 141, 62, 0.36), rgba(126, 86, 22, 0.52))',
  '--launcher-icon-clipboard-bg': 'linear-gradient(180deg, rgba(135, 107, 184, 0.36), rgba(76, 57, 124, 0.54))',
  '--launcher-icon-snippet-bg': 'linear-gradient(180deg, rgba(151, 99, 188, 0.36), rgba(92, 52, 124, 0.56))',
  '--launcher-icon-command-bg': 'linear-gradient(180deg, rgba(181, 113, 70, 0.36), rgba(112, 54, 26, 0.52))',
  '--launcher-icon-alias-bg': 'linear-gradient(180deg, rgba(143, 122, 181, 0.36), rgba(74, 61, 117, 0.54))',
  '--launcher-kind-bg': 'rgba(255, 255, 255, 0.06)',
  '--launcher-kind-fg': '#c8d3de',
  '--launcher-panel-border': 'rgba(170, 192, 214, 0.14)',
  '--launcher-panel-bg': 'rgba(255, 255, 255, 0.03)',
  '--launcher-panel-divider': 'rgba(255, 255, 255, 0.06)',
  '--launcher-panel-surface': 'rgba(255, 255, 255, 0.028)',
  '--launcher-preview-body-fg': 'rgba(245, 247, 250, 0.78)',
  '--launcher-footer-text': 'rgba(245, 247, 250, 0.76)',
  '--launcher-kbd-border': 'rgba(255, 255, 255, 0.08)',
  '--launcher-kbd-bg': 'rgba(255, 255, 255, 0.06)',
  '--launcher-kbd-fg': '#ddd',
  '--launcher-control-bg': 'rgba(255, 255, 255, 0.06)',
  '--launcher-control-border': 'rgba(255, 255, 255, 0.08)',
  '--launcher-control-hover-bg': 'rgba(255, 255, 255, 0.09)',
  '--launcher-actions-panel-border': 'rgba(158, 181, 204, 0.18)',
  '--launcher-actions-panel-bg': 'linear-gradient(180deg, rgba(36, 44, 53, 0.98), rgba(20, 25, 31, 0.99)), rgba(12, 15, 18, 0.98)',
  '--launcher-actions-panel-highlight': 'rgba(255, 255, 255, 0.03)',
  '--launcher-actions-panel-shadow': 'rgba(0, 0, 0, 0.34)',
  '--launcher-action-hover-bg': 'rgba(255, 255, 255, 0.06)',
  '--launcher-action-hover-border': 'rgba(158, 181, 204, 0.18)',
  '--launcher-input-border': 'rgba(255, 255, 255, 0.08)',
  '--launcher-input-bg': 'rgba(255, 255, 255, 0.05)',
  '--launcher-feedback-success-bg': 'rgba(31, 104, 62, 0.92)',
  '--launcher-feedback-error-bg': 'rgba(132, 48, 48, 0.94)',
  '--launcher-theme-switch-bg': 'rgba(255, 255, 255, 0.05)',
  '--launcher-theme-switch-border': 'rgba(170, 192, 214, 0.14)',
  '--launcher-theme-switch-hover-bg': 'rgba(255, 255, 255, 0.09)',
  '--launcher-theme-switch-label': 'rgba(245, 247, 250, 0.54)',
  '--launcher-theme-switch-value': '#f5f7fa'
};

export const launcherThemes: readonly LauncherThemeDefinition[] = [
  {
    id: 'original',
    label: 'Original',
    cssVariables: originalThemeCssVariables
  },
  {
    id: 'sandbox',
    label: 'Sandbox',
    cssVariables: {
      ...originalThemeCssVariables
    }
  }
] as const;

const launcherThemeMap = new Map<LauncherThemeId, LauncherThemeDefinition>(launcherThemes.map((theme) => [theme.id, theme]));

export function normalizeLauncherThemeId(value?: string | null): LauncherThemeId {
  return value === 'sandbox' || value === 'original' ? value : DEFAULT_LAUNCHER_THEME_ID;
}

export function getLauncherTheme(themeId?: string | null): LauncherThemeDefinition {
  return launcherThemeMap.get(normalizeLauncherThemeId(themeId)) ?? launcherThemes[0];
}

export function getNextLauncherThemeId(themeId?: string | null): LauncherThemeId {
  return normalizeLauncherThemeId(themeId) === 'original' ? 'sandbox' : 'original';
}

export function getLauncherThemeStyle(themeId?: string | null): CSSProperties {
  return getLauncherTheme(themeId).cssVariables as CSSProperties;
}
