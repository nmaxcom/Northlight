import type { LauncherAction, LauncherPreview, LauncherResult, LauncherSettings, LauncherStatus } from '../lib/search/types';
import type { LauncherBarMockState } from '../components/LauncherBar';

const noop = () => {};

function action(id: string, label: string, hint: string, feedbackLabel?: string): LauncherAction {
  return {
    id,
    label,
    hint,
    feedbackLabel,
    run: noop
  };
}

const positionPreview: LauncherPreview = {
  title: 'position.test.ts',
  subtitle: '/Users/nm4/STUFF/Coding/ChromeTranslate/tests/position.test.ts',
  body:
    'import { computePopupPosition } from "../src/lib/position";\n\nconst makeRect = (left: number, top: number, width: number, height: number) => ({\n  left,\n  top,\n  width,\n  height,\n  right: left + width,\n  bottom: top + height\n});\n\ndescribe("position", () => {\n  it("keeps the popup inside the viewport", () => {\n    const rect = makeRect(1200, 760, 320, 220);\n    const next = computePopupPosition(rect, { width: 360, height: 320 });\n\n    expect(next.left).toBeLessThanOrEqual(1200);\n    expect(next.top).toBeGreaterThanOrEqual(0);\n  });\n});',
  sections: [
    { label: 'Type', value: 'TS' },
    { label: 'Size', value: '1 KB' },
    { label: 'Modified', value: 'Feb 4, 2026, 03:56 AM' }
  ]
};

const settings: LauncherSettings = {
  aliases: [],
  snippets: [],
  scopes: [],
  launcherThemeId: 'sandbox',
  watchFsChangesEnabled: true,
  previewEnabled: true,
  clipboardHistoryEnabled: true,
  snippetsEnabled: true,
  bestMatchEnabled: true,
  appFirstEnabled: true,
  quickLookEnabled: true,
  quickLookStartsOpen: true,
  maxClipboardItems: 20,
  launcherHotkey: 'CommandOrControl+Shift+Space',
  launcherPosition: null
};

const status: LauncherStatus = {
  appVersion: '0.8.1',
  indexEntryCount: 30487,
  indexReady: true,
  isRestoring: false,
  isRefreshing: false,
  searchMode: 'hybrid',
  catalogState: 'ready'
};

const iconUrls: Record<string, string> = {
  '/Users/nm4/STUFF/Coding/ChromeTranslate':
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='%2388c8ff'/><stop offset='1' stop-color='%234d87cb'/></linearGradient></defs><path d='M9 22c0-5 4-9 9-9h10l4 5h14c5 0 9 4 9 9v18c0 5-4 9-9 9H18c-5 0-9-4-9-9V22z' fill='url(%23g)'/><path d='M9 26h46v18c0 6-4 10-10 10H19c-6 0-10-4-10-10V26z' fill='rgba(255,255,255,0.10)'/></svg>"
};

function result(id: string, title: string, subtitle: string, kind: LauncherResult['kind'], path: string, source: LauncherResult['source'], actions: LauncherAction[], preview?: LauncherPreview): LauncherResult {
  return {
    id,
    title,
    subtitle,
    icon: null,
    kind,
    score: 100,
    path,
    source,
    actions,
    preview
  };
}

const fileActions = [
  action('open-file', 'Open File', 'Enter', 'Opened file'),
  action('reveal-file', 'Reveal in Finder', '⌘+Enter', 'Revealed in Finder'),
  action('copy-file-path', 'Copy Path', '⌘+Shift+C', 'Copied path')
];

const results: LauncherResult[] = [
  result(
    'position-test',
    'position.test.ts',
    '/Users/nm4/STUFF/Coding/ChromeTranslate/tests/position.test.ts',
    'file',
    '/Users/nm4/STUFF/Coding/ChromeTranslate/tests/position.test.ts',
    'local',
    fileActions,
    positionPreview
  ),
  result(
    'position-lib',
    'position.ts',
    '/Users/nm4/STUFF/Coding/ChromeTranslate/src/lib/position.ts',
    'file',
    '/Users/nm4/STUFF/Coding/ChromeTranslate/src/lib/position.ts',
    'local',
    [action('open-position-lib', 'Open File', 'Enter')]
  ),
  result(
    'popup-spec',
    'popup.spec.ts',
    '/Users/nm4/STUFF/Coding/ChromeTranslate/tests/popup.spec.ts',
    'file',
    '/Users/nm4/STUFF/Coding/ChromeTranslate/tests/popup.spec.ts',
    'local',
    [action('open-popup-spec', 'Open File', 'Enter')]
  ),
  result(
    'panel-styles',
    'panel.css',
    '/Users/nm4/STUFF/Coding/ChromeTranslate/src/styles/panel.css',
    'file',
    '/Users/nm4/STUFF/Coding/ChromeTranslate/src/styles/panel.css',
    'local',
    [action('open-panel-styles', 'Open File', 'Enter')]
  ),
  result(
    'project-folder',
    'ChromeTranslate',
    '/Users/nm4/STUFF/Coding/ChromeTranslate',
    'folder',
    '/Users/nm4/STUFF/Coding/ChromeTranslate',
    'local',
    [action('open-project-folder', 'Open Folder', 'Enter')]
  )
];

export const launcherCurrentViewMock: LauncherBarMockState = {
  query: 'pos',
  results,
  selectedIndex: 0,
  pointerActive: true,
  isResolving: false,
  isActionsOpen: false,
  actionQuery: '',
  actionSelectedIndex: 0,
  preview: positionPreview,
  settings,
  status,
  iconUrls
};
