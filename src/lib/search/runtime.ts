import { clearRankStore, recordSelection } from './adaptiveRanking';
import { matchesLocalIntent, searchIntentKey } from './intentParser';
import { fileFixtures } from './mockData';
import { adaptiveRankBoost } from './adaptiveRanking';
import { baseSearchScore } from './scoring';
import { resolveLauncherShortcut } from '../shortcuts';
import { modifiedAtMatchesIntentTime, pathMatchesIntentScope } from './intentScope';
import type { ClipboardEntry, LauncherPreview, LauncherSettings, LauncherStatus, LocalSearchItem, SearchIntent } from './types';
import { DEFAULT_LAUNCHER_THEME_ID } from '../../launcherTheme';
import type {
  LauncherTraceDump,
  LauncherTraceDumpFile,
  LauncherTraceEvent,
  LauncherTraceIdleSummary,
  LauncherTraceState
} from './types';

const queryCache = new Map<string, LocalSearchItem[]>();
const defaultSettings: LauncherSettings = {
  aliases: [
    { id: 'alias-btt', trigger: 'btt', targetType: 'path', target: '/Applications/BetterTouchTool.app', note: 'BetterTouchTool' },
    { id: 'alias-settings', trigger: 'prefs', targetType: 'settings', target: 'settings', note: 'Open Northlight settings' }
  ],
  snippets: [
    {
      id: 'snippet-steel-review',
      trigger: 'steel-review',
      content: 'Review the launcher UX for speed, hierarchy, and keyboard affordances.',
      note: 'Launcher review checklist'
    }
  ],
  scopes: [
    { id: 'scope-0', path: '/Applications', enabled: true },
    { id: 'scope-1', path: '/Users/nm4/Applications', enabled: true },
    { id: 'scope-2', path: '/Users/nm4/Desktop', enabled: true },
    { id: 'scope-3', path: '/Users/nm4/Documents', enabled: true },
    { id: 'scope-4', path: '/Users/nm4/Downloads', enabled: true },
    { id: 'scope-5', path: '/Users/nm4/STUFF/Coding', enabled: true }
  ],
  launcherThemeId: DEFAULT_LAUNCHER_THEME_ID,
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
let settingsCache: LauncherSettings = defaultSettings;
let clipboardCache: ClipboardEntry[] = [];
const previewCache = new Map<string, LauncherPreview | null>();
let traceStateCache: LauncherTraceState = {
  enabled: false,
  sessionId: ''
};

function clearTransientCaches() {
  queryCache.clear();
  previewCache.clear();
}

function cacheKey(query: string, scopePath?: string | null, intent?: SearchIntent | null) {
  return `${scopePath ?? '__global__'}::${query.trim().toLowerCase()}::${searchIntentKey(intent)}`;
}

function filterByScope(items: LocalSearchItem[], scopePath?: string | null) {
  if (!scopePath) {
    return items;
  }

  return items.filter((item) => item.path.startsWith(`${scopePath}/`) || item.path === scopePath);
}

function rankItems(query: string, items: LocalSearchItem[], intent?: SearchIntent | null) {
  return items
    .filter((item) => matchesLocalIntent(item, intent?.localFilter))
    .filter((item) => pathMatchesIntentScope(item.path, intent?.scopeToken, intent?.scopePath, settingsCache.scopes))
    .filter((item) => modifiedAtMatchesIntentTime(item.modifiedAt, intent?.timeToken))
    .map((item) => ({
      ...item,
      score:
        Math.max(item.score, baseSearchScore(query, item)) +
        adaptiveRankBoost(item.path) +
        (settingsCache.appFirstEnabled && item.kind === 'app' ? 18 : 0)
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name))
    .slice(0, 12);
}

async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

async function searchFixtureIndex(query: string, scopePath?: string | null, intent?: SearchIntent | null): Promise<LocalSearchItem[]> {
  const trimmed = query.trim();

  if (trimmed.length < 2) {
    return [];
  }

  return rankItems(trimmed, filterByScope(fileFixtures, scopePath), intent);
}

function searchCachedLocal(query: string, scopePath?: string | null, intent?: SearchIntent | null) {
  const trimmed = query.trim();

  if (trimmed.length < 2) {
    return [];
  }

  const direct = queryCache.get(cacheKey(trimmed, scopePath, intent));
  if (direct) {
    return direct;
  }

  for (let length = trimmed.length - 1; length >= 2; length -= 1) {
    const prefix = trimmed.slice(0, length);
    const prefixResults = queryCache.get(cacheKey(prefix, scopePath, intent));

    if (!prefixResults) {
      continue;
    }

    return rankItems(trimmed, prefixResults, intent);
  }

  return [];
}

export const launcherRuntime = {
  clearRankStore,
  getTraceState(force = false): Promise<LauncherTraceState> {
    if (!force && traceStateCache.sessionId) {
      return Promise.resolve(traceStateCache);
    }

    return (
      window.launcher?.getTraceState?.().then((state) => {
        traceStateCache = state;
        return state;
      }) ??
      Promise.resolve(traceStateCache)
    );
  },
  setTraceEnabled(enabled: boolean): Promise<LauncherTraceState> {
    return (
      window.launcher?.setTraceEnabled?.(enabled).then((state) => {
        traceStateCache = state;
        return state;
      }) ??
      Promise.resolve({
        enabled,
        sessionId: traceStateCache.sessionId
      })
    );
  },
  traceEvent(event: LauncherTraceEvent) {
    if (!traceStateCache.enabled || !window.launcher?.traceEvent) {
      return Promise.resolve();
    }

    return window.launcher.traceEvent(event);
  },
  getTraceDump(): Promise<LauncherTraceDump> {
    return (
      window.launcher?.getTraceDump?.() ??
      Promise.resolve({
        enabled: traceStateCache.enabled,
        sessionId: traceStateCache.sessionId,
        generatedAt: Date.now(),
        events: []
      })
    );
  },
  getIdleTraceSummary(): Promise<LauncherTraceIdleSummary> {
    return (
      window.launcher?.getIdleTraceSummary?.() ??
      Promise.resolve({
        fromTimestamp: Date.now(),
        toTimestamp: Date.now(),
        idleMs: 0,
        totalEvents: 0,
        uniqueEventCount: 0,
        topEvents: []
      })
    );
  },
  writeTraceDump(): Promise<LauncherTraceDumpFile> {
    return (
      window.launcher?.writeTraceDump?.() ??
      Promise.resolve({
        path: '',
        sessionId: traceStateCache.sessionId,
        eventCount: 0,
        generatedAt: Date.now()
      })
    );
  },
  getSettings() {
    return window.launcher?.getSettings?.().then((settings) => {
      settingsCache = settings;
      return settings;
    }) ?? Promise.resolve(settingsCache);
  },
  getSettingsSnapshot() {
    return settingsCache;
  },
  getEffectiveShortcut() {
    return window.launcher?.getEffectiveShortcut?.() ?? Promise.resolve(resolveLauncherShortcut(settingsCache.launcherHotkey, false));
  },
  saveSettings(settings: LauncherSettings) {
    settingsCache = settings;
    return window.launcher?.saveSettings?.(settings).then((nextSettings) => {
      settingsCache = nextSettings;
      clearTransientCaches();
      return nextSettings;
    }) ?? Promise.resolve(settings);
  },
  getClipboardHistory() {
    return (
      window.launcher?.getClipboardHistory?.().then((items) => {
        clipboardCache = items;
        return items;
      }) ?? Promise.resolve(clipboardCache)
    );
  },
  getClipboardHistorySnapshot() {
    return clipboardCache;
  },
  openSettings() {
    return window.launcher?.openSettings?.() ?? Promise.resolve();
  },
  getPathPreview(path: string, kind: LocalSearchItem['kind'], requestId?: string): Promise<LauncherPreview | null> {
    const cacheEntry = previewCache.get(`${kind}:${path}`);
    if (cacheEntry !== undefined) {
      return Promise.resolve(cacheEntry);
    }

    return (
      window.launcher?.getPathPreview?.(path, kind, requestId).then((preview) => {
        previewCache.set(`${kind}:${path}`, preview);
        return preview;
      }) ?? Promise.resolve(null)
    );
  },
  getPathIcon(path: string, requestId?: string): Promise<string | null> {
    return window.launcher?.getPathIcon?.(path, requestId) ?? Promise.resolve(null);
  },
  getPathIcons(paths: string[], requestId?: string) {
    if (window.launcher?.getPathIcons) {
      return window.launcher.getPathIcons(paths, requestId);
    }

    return Promise.all(paths.map(async (path) => [path, await launcherRuntime.getPathIcon(path, requestId)] as const)).then((pairs) =>
      Object.fromEntries(pairs)
    );
  },
  quickLookPath(path: string) {
    return window.launcher?.quickLookPath?.(path) ?? Promise.resolve();
  },
  onSettingsChanged(callback: (settings: LauncherSettings) => void) {
    if (!window.launcher?.onSettingsChanged) {
      return () => {};
    }

    return window.launcher.onSettingsChanged((settings) => {
      settingsCache = settings;
      clearTransientCaches();
      callback(settings);
    });
  },
  onIndexChanged(callback: () => void) {
    if (!window.launcher?.onIndexChanged) {
      return () => {};
    }

    return window.launcher.onIndexChanged(() => {
      clearTransientCaches();
      callback();
    });
  },
  getCachedLocal(query: string, scopePath?: string | null, intent?: SearchIntent | null) {
    return searchCachedLocal(query, scopePath, intent);
  },
  getRecentLocalItems() {
    const merged = new Map<string, LocalSearchItem>();

    for (const fixture of fileFixtures) {
      merged.set(fixture.path, fixture);
    }

    for (const items of queryCache.values()) {
      for (const item of items) {
        merged.set(item.path, item);
      }
    }

    return Array.from(merged.values())
      .map((item) => ({
        ...item,
        score: adaptiveRankBoost(item.path)
      }))
      .filter((item) => item.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, 8);
  },
  searchLocal(query: string, scopePath?: string | null, intent?: SearchIntent | null, requestId?: string) {
    if (window.launcher?.searchLocal) {
      return window.launcher.searchLocal(query, scopePath, intent, requestId).then((results) => {
        const ranked = rankItems(query.trim(), filterByScope(results, scopePath), intent);

        if (ranked.length > 0) {
          queryCache.set(cacheKey(query, scopePath, intent), ranked);
        }

        return ranked;
      });
    }

    return searchFixtureIndex(query, scopePath, intent).then((results) => {
      if (results.length > 0) {
        queryCache.set(cacheKey(query, scopePath, intent), results);
      }
      return results;
    });
  },
  getStatus(requestId?: string): Promise<LauncherStatus> {
    return (
      window.launcher?.getStatus?.(requestId) ??
      Promise.resolve({
        appVersion: '0.8.9',
        searchMode: 'hybrid',
        catalogState: 'ready',
        indexEntryCount: fileFixtures.length,
        indexReady: true,
        isRestoring: false,
        isRefreshing: false
      })
    );
  },
  recordSelection(item: string | Pick<LocalSearchItem, 'path' | 'name' | 'kind'>) {
    const normalized =
      typeof item === 'string'
        ? {
            path: item,
            name: item.split('/').at(-1) ?? item,
            kind: (item.endsWith('.app') ? 'app' : 'file') as const
          }
        : item;
    recordSelection(normalized.path);
    void window.launcher?.recordLocalSelection?.(normalized);
    queryCache.clear();
  },
  openPath(path: string) {
    return window.launcher?.openPath(path) ?? Promise.resolve();
  },
  revealPath(path: string) {
    return window.launcher?.revealPath(path) ?? Promise.resolve();
  },
  openInTerminal(path: string) {
    return window.launcher?.openInTerminal(path) ?? Promise.resolve();
  },
  openWithTextEdit(path: string) {
    return window.launcher?.openWithTextEdit(path) ?? Promise.resolve();
  },
  trashPath(path: string) {
    return window.launcher?.trashPath(path) ?? Promise.resolve();
  },
  hide() {
    return window.launcher?.hide() ?? Promise.resolve();
  },
  copyText,
  clearTransientCaches
};
