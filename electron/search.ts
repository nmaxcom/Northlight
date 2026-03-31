import { app } from 'electron';
import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { watch, type FSWatcher } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { recordTrace } from './diagnostics';
import { isPrivateNorthlightPath } from '../src/lib/search/searchExclusions';
import { baseSearchScore } from '../src/lib/search/scoring';
import { localIntentFilterKey, matchesLocalIntent, type LocalIntentFilter } from '../src/lib/search/intentParser';
import { isWatchableScope } from '../src/lib/search/watchScopePolicy';
import type { LauncherStatus, LocalSearchItem, ResultKind } from '../src/lib/search/types';
import { getLauncherSettings, getLauncherStateSnapshot } from './settings';

const MAX_RESULTS = 12;
const MAX_INDEX_ENTRIES = 30_000;
const INDEX_CACHE_FILENAME = 'local-search-index.json';
const FALLBACK_ROOTS = [
  { path: '/Applications', maxDepth: 2 },
  { path: join(homedir(), 'Applications'), maxDepth: 2 },
  { path: join(homedir(), 'Desktop'), maxDepth: 5 },
  { path: join(homedir(), 'Documents'), maxDepth: 5 },
  { path: join(homedir(), 'Downloads'), maxDepth: 4 },
  { path: join(homedir(), 'STUFF', 'Coding'), maxDepth: 6 }
];
const EXCLUDED_SEGMENTS = [
  '/.git/',
  '/node_modules/',
  '/dist/',
  '/out/',
  '/(A Document Being Saved By Sparkle)/',
  '/Library/Developer/',
  '/Library/Caches/',
  '/Library/Application Support/Code/User/globalStorage/',
  '/.Trash/'
];
const PREFERRED_SEGMENTS = [
  join(homedir(), 'STUFF', 'Coding'),
  join(homedir(), 'Desktop'),
  join(homedir(), 'Documents'),
  join(homedir(), 'Downloads'),
  '/Applications'
];
let appPrivateRootsCache: string[] | null = null;

type IndexedEntry = Omit<LocalSearchItem, 'score'>;
type RootConfig = (typeof FALLBACK_ROOTS)[number];
type WalkNode = {
  path: string;
  depth: number;
  maxDepth: number;
};

type SearchTraceContext = {
  requestId?: string;
};

let fallbackIndex: IndexedEntry[] = [];
let fallbackIndexReady = false;
let restorePromise: Promise<void> | null = null;
let refreshPromise: Promise<void> | null = null;
let isRestoringIndex = false;
const queryCache = new Map<string, LocalSearchItem[]>();
let indexChangedListener: (() => void) | null = null;
let watcherDebounce: ReturnType<typeof setTimeout> | null = null;
let scopeWatchers: FSWatcher[] = [];

async function pathExists(path: string) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function notifyIndexChanged() {
  recordTrace({
    subsystem: 'search',
    event: 'index-changed'
  });
  indexChangedListener?.();
}

function clearScopeWatchers() {
  for (const watcher of scopeWatchers) {
    watcher.close();
  }

  scopeWatchers = [];

  if (watcherDebounce) {
    clearTimeout(watcherDebounce);
    watcherDebounce = null;
  }
}

function cacheFilePath() {
  return join(app.getPath('userData'), INDEX_CACHE_FILENAME);
}

function basename(path: string) {
  const segments = path.split('/').filter(Boolean);
  return segments.at(-1) ?? path;
}

function classifyPath(path: string, isDirectory: boolean): ResultKind {
  if (path.endsWith('.app')) {
    return 'app';
  }

  return isDirectory ? 'folder' : 'file';
}

function isExcludedPath(path: string) {
  return EXCLUDED_SEGMENTS.some((segment) => path.includes(segment)) || appPrivateRoots().some((root) => isPrivateNorthlightPath(path, root));
}

function appPrivateRoots() {
  if (appPrivateRootsCache) {
    return appPrivateRootsCache;
  }

  try {
    appPrivateRootsCache = [app.getPath('userData')];
  } catch {
    appPrivateRootsCache = [];
  }

  return appPrivateRootsCache;
}

function preferredBoost(path: string) {
  for (const segment of PREFERRED_SEGMENTS) {
    if (path.startsWith(segment)) {
      return 18;
    }
  }

  return 0;
}

function systemPenalty(path: string) {
  if (path.startsWith('/System/') || path.startsWith('/Library/')) {
    return 28;
  }

  if (path.includes('/Library/')) {
    return 14;
  }

  return 0;
}

function rankItem(query: string, entry: IndexedEntry) {
  const settings = getLauncherStateSnapshot().settings;
  const baseScore = baseSearchScore(query, entry);

  if (baseScore === 0) {
    return 0;
  }

  const appBoost = settings.appFirstEnabled && entry.kind === 'app' ? 18 : 0;
  return baseScore + preferredBoost(entry.path) + appBoost - systemPenalty(entry.path) - Math.min(entry.path.split('/').length, 12);
}

function filterByScope<T extends { path: string }>(items: T[], scopePath?: string | null) {
  if (!scopePath) {
    return items;
  }

  return items.filter((item) => item.path.startsWith(scopePath.endsWith('/') ? scopePath : `${scopePath}/`) || item.path === scopePath);
}

function cacheKey(query: string, scopePath?: string | null, localFilter?: LocalIntentFilter | null) {
  return `${scopePath ?? '__global__'}::${query.trim().toLowerCase()}::${localIntentFilterKey(localFilter)}`;
}

async function existingRoots(scopePath?: string | null) {
  if (scopePath) {
    try {
      await access(scopePath);
      return [{ path: scopePath, maxDepth: 5 }];
    } catch {
      return [];
    }
  }

  const configuredScopes = (await getLauncherSettings()).scopes.filter((scope) => scope.enabled);
  if (configuredScopes.length > 0) {
    const checks = await Promise.all(
      configuredScopes.map(async (scope) => {
        try {
          await access(scope.path);
          return { path: scope.path, maxDepth: scope.path.endsWith('.app') ? 1 : 6 };
        } catch {
          return null;
        }
      })
    );

    const validScopes = checks.filter((scope): scope is RootConfig => scope !== null);
    if (validScopes.length > 0) {
      return validScopes;
    }
  }

  const checks = await Promise.all(
    FALLBACK_ROOTS.map(async (root) => {
      try {
        await access(root.path);
        return root;
      } catch {
        return null;
      }
    })
  );

  return checks.filter((root): root is RootConfig => root !== null);
}

async function loadPersistedIndex() {
  try {
    const raw = await readFile(cacheFilePath(), 'utf8');
    const parsed = JSON.parse(raw) as IndexedEntry[];

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return false;
    }

    fallbackIndex = parsed.slice(0, MAX_INDEX_ENTRIES);
    fallbackIndexReady = true;
    return true;
  } catch {
    return false;
  }
}

async function persistIndex(nextIndex: IndexedEntry[]) {
  if (nextIndex.length === 0) {
    return;
  }

  try {
    await mkdir(app.getPath('userData'), { recursive: true });
    await writeFile(cacheFilePath(), JSON.stringify(nextIndex), 'utf8');
  } catch {
    // Ignore persistence failures; the in-memory index still serves results.
  }
}

async function stripMissingResults(results: LocalSearchItem[]) {
  if (results.length === 0) {
    return { results, removedPaths: [] as string[] };
  }

  const existence = await Promise.all(results.map(async (result) => [result.path, await pathExists(result.path)] as const));
  const missingPaths = new Set(existence.filter(([, exists]) => !exists).map(([path]) => path));

  return {
    results: results.filter((result) => !missingPaths.has(result.path)),
    removedPaths: Array.from(missingPaths)
  };
}

async function pruneMissingEntries(paths: string[]) {
  if (paths.length === 0) {
    return;
  }

  const missingSet = new Set(paths);
  const nextIndex = fallbackIndex.filter((entry) => !missingSet.has(entry.path));

  if (nextIndex.length === fallbackIndex.length) {
    return;
  }

  fallbackIndex = nextIndex;
  fallbackIndexReady = fallbackIndex.length > 0;
  queryCache.clear();
  await persistIndex(fallbackIndex);
  notifyIndexChanged();
}

function searchFallbackIndex(query: string, scopePath?: string | null, localFilter?: LocalIntentFilter | null) {
  const startedAt = Date.now();
  const normalizedQuery = query.trim();

  if (!fallbackIndexReady || normalizedQuery.length < 2) {
    recordTrace({
      subsystem: 'search',
      event: 'fallback-index-skip',
      query,
      scopePath,
      localFilter,
      durationMs: Date.now() - startedAt,
      resultCount: 0,
      details: {
        fallbackReady: fallbackIndexReady,
        tooShort: normalizedQuery.length < 2
      }
    });
    return [];
  }

  const results = filterByScope(fallbackIndex, scopePath)
    .filter((entry) => matchesLocalIntent(entry, localFilter))
    .map((entry) => ({
      ...entry,
      score: rankItem(normalizedQuery, entry)
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name))
    .slice(0, MAX_RESULTS);

  recordTrace({
    subsystem: 'search',
    event: 'fallback-index-complete',
    query,
    scopePath,
    localFilter,
    durationMs: Date.now() - startedAt,
    resultCount: results.length
  });

  return results;
}

async function walkForIndex(roots: RootConfig[]) {
  const queue: WalkNode[] = roots.map((root) => ({
    path: root.path,
    depth: 0,
    maxDepth: root.maxDepth
  }));
  const indexed: IndexedEntry[] = [];

  while (queue.length > 0 && indexed.length < MAX_INDEX_ENTRIES) {
    const current = queue.shift();

    if (!current || isExcludedPath(current.path)) {
      continue;
    }

    const currentName = basename(current.path);
    const looksLikeDirectory = !currentName.includes('.') || current.path.endsWith('.app');

    if (current.depth > 0) {
      indexed.push({
        id: current.path,
        path: current.path,
        name: currentName,
        kind: classifyPath(current.path, looksLikeDirectory)
      });
    }

    if (current.depth >= current.maxDepth || current.path.endsWith('.app')) {
      continue;
    }

    try {
      const entries = await readdir(current.path, { withFileTypes: true });

      for (const entry of entries) {
        if (indexed.length >= MAX_INDEX_ENTRIES) {
          break;
        }

        const nextPath = join(current.path, entry.name);

        if (isExcludedPath(nextPath)) {
          continue;
        }

        if (entry.isDirectory() || entry.isFile() || entry.name.endsWith('.app')) {
          queue.push({
            path: nextPath,
            depth: current.depth + 1,
            maxDepth: current.maxDepth
          });
        }
      }
    } catch {
      continue;
    }
  }

  return indexed;
}

async function searchTargetedPaths(
  query: string,
  scopePath?: string | null,
  localFilter?: LocalIntentFilter | null,
  traceContext: SearchTraceContext = {}
) {
  const startedAt = Date.now();
  const roots = await existingRoots(scopePath);

  if (roots.length === 0) {
    recordTrace({
      subsystem: 'search',
      event: 'targeted-search-skip',
      requestId: traceContext.requestId,
      query,
      scopePath,
      localFilter,
      durationMs: Date.now() - startedAt,
      resultCount: 0,
      details: {
        reason: 'no-roots'
      }
    });
    return [];
  }

  const queue: WalkNode[] = roots.map((root) => ({
    path: root.path,
    depth: 0,
    maxDepth: Math.min(root.maxDepth, 4)
  }));
  const matches: LocalSearchItem[] = [];

  while (queue.length > 0 && matches.length < MAX_RESULTS * 4) {
    const current = queue.shift();

    if (!current || isExcludedPath(current.path)) {
      continue;
    }

    const currentName = basename(current.path);
    const looksLikeDirectory = !currentName.includes('.') || current.path.endsWith('.app');

    if (current.depth > 0) {
      const candidate: IndexedEntry = {
        id: current.path,
        path: current.path,
        name: currentName,
        kind: classifyPath(current.path, looksLikeDirectory)
      };
      const score = rankItem(query, candidate);

      if (score > 0 && matchesLocalIntent(candidate, localFilter)) {
        matches.push({
          ...candidate,
          score
        });
      }
    }

    if (current.depth >= current.maxDepth || current.path.endsWith('.app')) {
      continue;
    }

    try {
      const entries = await readdir(current.path, { withFileTypes: true });

      for (const entry of entries) {
        const nextPath = join(current.path, entry.name);

        if (isExcludedPath(nextPath)) {
          continue;
        }

        const candidate: IndexedEntry = {
          id: nextPath,
          path: nextPath,
          name: entry.name,
          kind: classifyPath(nextPath, entry.isDirectory() || entry.name.endsWith('.app'))
        };
        const looksRelevant = current.depth < 1 || rankItem(query, candidate) > 0;

        if (looksRelevant && (entry.isDirectory() || entry.isFile() || entry.name.endsWith('.app'))) {
          queue.push({
            path: nextPath,
            depth: current.depth + 1,
            maxDepth: current.maxDepth
          });
        }
      }
    } catch {
      continue;
    }
  }

  const results = matches
    .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name))
    .slice(0, MAX_RESULTS);

  recordTrace({
    subsystem: 'search',
    event: 'targeted-search-complete',
    requestId: traceContext.requestId,
    query,
    scopePath,
    localFilter,
    durationMs: Date.now() - startedAt,
    resultCount: results.length,
    details: {
      rootCount: roots.length
    }
  });

  return results;
}

async function refreshIndex() {
  const startedAt = Date.now();
  const roots = await existingRoots();

  if (roots.length === 0) {
    recordTrace({
      subsystem: 'search',
      event: 'refresh-skip',
      durationMs: Date.now() - startedAt,
      resultCount: 0,
      details: {
        reason: 'no-roots'
      }
    });
    return;
  }

  try {
    recordTrace({
      subsystem: 'search',
      event: 'refresh-start',
      details: {
        rootCount: roots.length
      }
    });
    const scanned = await walkForIndex(roots);

    if (scanned.length === 0) {
      recordTrace({
        subsystem: 'search',
        event: 'refresh-empty',
        durationMs: Date.now() - startedAt,
        resultCount: 0
      });
      return;
    }

    fallbackIndex = scanned.slice(0, MAX_INDEX_ENTRIES);
    fallbackIndexReady = true;
    queryCache.clear();
    await persistIndex(fallbackIndex);
    notifyIndexChanged();
    recordTrace({
      subsystem: 'search',
      event: 'refresh-complete',
      durationMs: Date.now() - startedAt,
      resultCount: fallbackIndex.length
    });
  } catch {
    // Keep the last good index on refresh failure.
    recordTrace({
      subsystem: 'search',
      event: 'refresh-error',
      durationMs: Date.now() - startedAt,
      outcome: 'error'
    });
  }
}

function scheduleRefresh() {
  recordTrace({
    subsystem: 'search',
    event: 'schedule-refresh',
    details: {
      inflight: refreshPromise !== null
    }
  });
  if (!refreshPromise) {
    refreshPromise = refreshIndex().finally(() => {
      refreshPromise = null;
    });
  }
}

export function warmSearchIndex() {
  if (!restorePromise) {
    restorePromise = (async () => {
      const startedAt = Date.now();
      isRestoringIndex = true;
      recordTrace({
        subsystem: 'search',
        event: 'restore-start'
      });
      await loadPersistedIndex();
      isRestoringIndex = false;
      recordTrace({
        subsystem: 'search',
        event: 'restore-complete',
        durationMs: Date.now() - startedAt,
        resultCount: fallbackIndex.length,
        details: {
          fallbackReady: fallbackIndexReady
        }
      });
      scheduleRefresh();
    })();
  } else if (!refreshPromise) {
    scheduleRefresh();
  }

  return restorePromise;
}

function scheduleWatcherRefresh() {
  recordTrace({
    subsystem: 'watcher',
    event: 'schedule-watcher-refresh'
  });
  queryCache.clear();
  notifyIndexChanged();

  if (watcherDebounce) {
    clearTimeout(watcherDebounce);
  }

  watcherDebounce = setTimeout(() => {
    watcherDebounce = null;
    scheduleRefresh();
  }, 350);
}

export async function configureIndexWatchers() {
  clearScopeWatchers();

  const settings = await getLauncherSettings();
  if (!settings.watchFsChangesEnabled) {
    recordTrace({
      subsystem: 'watcher',
      event: 'configure-skip',
      details: {
        reason: 'disabled'
      }
    });
    return;
  }

  const roots = await existingRoots();
  for (const root of roots) {
    if (!isWatchableScope(root.path, homedir())) {
      recordTrace({
        subsystem: 'watcher',
        event: 'scope-skipped',
        scopePath: root.path,
        details: {
          reason: 'policy'
        }
      });
      continue;
    }

    try {
      const watcher = watch(root.path, { recursive: true }, (_eventType, relativePath) => {
        if (typeof relativePath === 'string' && relativePath.length > 0) {
          const changedPath = join(root.path, relativePath);
          if (isExcludedPath(changedPath)) {
            recordTrace({
              subsystem: 'watcher',
              event: 'event-ignored',
              scopePath: root.path,
              path: changedPath,
              details: {
                reason: 'excluded'
              }
            });
            return;
          }

          recordTrace({
            subsystem: 'watcher',
            event: 'event-accepted',
            scopePath: root.path,
            path: changedPath
          });
        }

        scheduleWatcherRefresh();
      });
      scopeWatchers.push(watcher);
      recordTrace({
        subsystem: 'watcher',
        event: 'scope-attached',
        scopePath: root.path
      });
    } catch {
      // Skip scopes that cannot be watched; search still works via refresh and fallback scans.
      recordTrace({
        subsystem: 'watcher',
        event: 'scope-error',
        scopePath: root.path,
        outcome: 'error'
      });
    }
  }
}

export function setIndexChangedListener(listener: (() => void) | null) {
  indexChangedListener = listener;
}

export function getSearchStatus(appVersion: string): LauncherStatus {
  return {
    appVersion,
    indexEntryCount: fallbackIndex.length,
    indexReady: fallbackIndexReady,
    isRestoring: isRestoringIndex,
    isRefreshing: refreshPromise !== null
  };
}

export async function searchIndexedPaths(
  query: string,
  scopePath?: string | null,
  localFilter?: LocalIntentFilter | null,
  traceContext: SearchTraceContext = {}
): Promise<LocalSearchItem[]> {
  const startedAt = Date.now();
  const trimmed = query.trim();

  if (trimmed.length < 2) {
    recordTrace({
      subsystem: 'search',
      event: 'search-skip',
      requestId: traceContext.requestId,
      query,
      scopePath,
      localFilter,
      durationMs: Date.now() - startedAt,
      resultCount: 0,
      details: {
        reason: 'too-short'
      }
    });
    return [];
  }

  await warmSearchIndex();

  const key = cacheKey(trimmed, scopePath, localFilter);
  const cached = queryCache.get(key);

  if (cached) {
    recordTrace({
      subsystem: 'search',
      event: 'search-complete',
      requestId: traceContext.requestId,
      query,
      scopePath,
      localFilter,
      durationMs: Date.now() - startedAt,
      resultCount: cached.length,
      cacheState: 'hit',
      details: {
        source: 'query-cache'
      }
    });
    return cached;
  }

  const indexed = searchFallbackIndex(trimmed, scopePath, localFilter);
  if (indexed.length > 0) {
    const { results: existingIndexed, removedPaths } = await stripMissingResults(indexed);
    if (removedPaths.length > 0) {
      await pruneMissingEntries(removedPaths);
    }

    if (existingIndexed.length > 0) {
      queryCache.set(key, existingIndexed);
      recordTrace({
        subsystem: 'search',
        event: 'search-complete',
        requestId: traceContext.requestId,
        query,
        scopePath,
        localFilter,
        durationMs: Date.now() - startedAt,
        resultCount: existingIndexed.length,
        cacheState: 'miss',
        details: {
          source: 'fallback-index'
        }
      });
      return existingIndexed;
    }
  }

  const targetedResults = await searchTargetedPaths(trimmed, scopePath, localFilter, traceContext);
  if (targetedResults.length > 0) {
    const { results: existingTargeted } = await stripMissingResults(targetedResults);
    if (existingTargeted.length > 0) {
      queryCache.set(key, existingTargeted);
      recordTrace({
        subsystem: 'search',
        event: 'search-complete',
        requestId: traceContext.requestId,
        query,
        scopePath,
        localFilter,
        durationMs: Date.now() - startedAt,
        resultCount: existingTargeted.length,
        cacheState: 'miss',
        details: {
          source: 'targeted-search'
        }
      });
      return existingTargeted;
    }
  }

  recordTrace({
    subsystem: 'search',
    event: 'search-complete',
    requestId: traceContext.requestId,
    query,
    scopePath,
    localFilter,
    durationMs: Date.now() - startedAt,
    resultCount: 0,
    cacheState: 'miss',
    details: {
      source: 'empty'
    }
  });
  return [];
}
