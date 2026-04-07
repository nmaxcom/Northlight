import type { LauncherSettings, LauncherStatus } from '../lib/search/types';
import type { LauncherBarMockState } from '../components/LauncherBar';

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
  appVersion: '0.8.35',
  indexEntryCount: 123344,
  indexReady: true,
  isRestoring: false,
  isRefreshing: false,
  searchMode: 'hybrid',
  catalogState: 'ready'
};

export const launcherCurrentViewMock: LauncherBarMockState = {
  query: '',
  results: [],
  selectedIndex: 0,
  pointerActive: false,
  isResolving: false,
  isActionsOpen: false,
  actionQuery: '',
  actionSelectedIndex: 0,
  preview: null,
  settings,
  status
};
