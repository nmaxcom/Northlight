import { clearRankStore, recordSelection } from './adaptiveRanking';
import { fileFixtures } from './mockData';
import { adaptiveRankBoost } from './adaptiveRanking';
import { baseSearchScore } from './scoring';
import type { ClipboardEntry, LauncherPreview, LauncherSettings, LauncherStatus, LocalSearchItem } from './types';

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

function clearTransientCaches() {
  queryCache.clear();
  previewCache.clear();
}

function cacheKey(query: string, scopePath?: string | null) {
  return `${scopePath ?? '__global__'}::${query.trim().toLowerCase()}`;
}

function filterByScope(items: LocalSearchItem[], scopePath?: string | null) {
  if (!scopePath) {
    return items;
  }

  return items.filter((item) => item.path.startsWith(`${scopePath}/`) || item.path === scopePath);
}

function rankItems(query: string, items: LocalSearchItem[]) {
  return items
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

async function searchFixtureIndex(query: string, scopePath?: string | null): Promise<LocalSearchItem[]> {
  const trimmed = query.trim();

  if (trimmed.length < 2) {
    return [];
  }

  return rankItems(trimmed, filterByScope(fileFixtures, scopePath));
}

function searchCachedLocal(query: string, scopePath?: string | null) {
  const trimmed = query.trim();

  if (trimmed.length < 2) {
    return [];
  }

  const direct = queryCache.get(cacheKey(trimmed, scopePath));
  if (direct) {
    return direct;
  }

  for (let length = trimmed.length - 1; length >= 2; length -= 1) {
    const prefix = trimmed.slice(0, length);
    const prefixResults = queryCache.get(cacheKey(prefix, scopePath));

    if (!prefixResults) {
      continue;
    }

    return rankItems(trimmed, prefixResults);
  }

  return [];
}

export const launcherRuntime = {
  clearRankStore,
  getSettings() {
    return window.launcher?.getSettings?.().then((settings) => {
      settingsCache = settings;
      return settings;
    }) ?? Promise.resolve(settingsCache);
  },
  getSettingsSnapshot() {
    return settingsCache;
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
  getPathPreview(path: string, kind: LocalSearchItem['kind']): Promise<LauncherPreview | null> {
    const cacheEntry = previewCache.get(`${kind}:${path}`);
    if (cacheEntry !== undefined) {
      return Promise.resolve(cacheEntry);
    }

    return (
      window.launcher?.getPathPreview?.(path, kind).then((preview) => {
        previewCache.set(`${kind}:${path}`, preview);
        return preview;
      }) ?? Promise.resolve(null)
    );
  },
  getPathIcon(path: string): Promise<string | null> {
    return window.launcher?.getPathIcon?.(path) ?? Promise.resolve(null);
  },
  getPathIcons(paths: string[]) {
    if (window.launcher?.getPathIcons) {
      return window.launcher.getPathIcons(paths);
    }

    return Promise.all(paths.map(async (path) => [path, await launcherRuntime.getPathIcon(path)] as const)).then((pairs) =>
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
  getCachedLocal(query: string, scopePath?: string | null) {
    return searchCachedLocal(query, scopePath);
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
  searchLocal(query: string, scopePath?: string | null) {
    if (window.launcher?.searchLocal) {
      return window.launcher.searchLocal(query, scopePath).then((results) => {
        const ranked = rankItems(query.trim(), filterByScope(results, scopePath));

        if (ranked.length > 0) {
          queryCache.set(cacheKey(query, scopePath), ranked);
        }

        return ranked;
      });
    }

    return searchFixtureIndex(query, scopePath).then((results) => {
      if (results.length > 0) {
        queryCache.set(cacheKey(query, scopePath), results);
      }
      return results;
    });
  },
  getStatus(): Promise<LauncherStatus> {
    return (
      window.launcher?.getStatus?.() ??
      Promise.resolve({
        appVersion: '0.7.0',
        indexEntryCount: fileFixtures.length,
        indexReady: true,
        isRestoring: false,
        isRefreshing: false
      })
    );
  },
  recordSelection(path: string) {
    recordSelection(path);
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
