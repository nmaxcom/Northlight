import { app } from 'electron';
import { execFile } from 'node:child_process';
import { access, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { watch, type FSWatcher } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { recordTrace } from './diagnostics';
import { modifiedAtMatchesIntentTime, resolveIntentScopePath } from '../src/lib/search/intentScope';
import { isPrivateNorthlightPath } from '../src/lib/search/searchExclusions';
import { composedSearchScore } from '../src/lib/search/scoring';
import { matchesLocalIntent, searchIntentKey } from '../src/lib/search/intentParser';
import { isWatchableScope } from '../src/lib/search/watchScopePolicy';
import type {
  LauncherStatus,
  LocalSearchItem,
  ResultKind,
  ScopePerformanceInsight,
  SearchContext,
  SearchIntent,
  SearchProvider,
  SearchProviderResult
} from '../src/lib/search/types';
import { getLauncherSettings, getLauncherStateSnapshot } from './settings';

const MAX_RESULTS = 12;
const MAX_INDEX_ENTRIES = 30_000;
const CATALOG_CACHE_FILENAME = 'local-search-catalog.json';
const LEGACY_INDEX_CACHE_FILENAME = 'local-search-index.json';
const SPOTLIGHT_TIMEOUT_MS = 1200;
const MAX_SPOTLIGHT_CANDIDATES = 120;
const DEFAULT_SCOPE_CONFIGS = [
  { path: '/Applications', maxDepth: 2, hot: true },
  { path: '/System/Applications', maxDepth: 2, hot: true },
  { path: join(homedir(), 'Applications'), maxDepth: 2, hot: true },
  { path: join(homedir(), 'Desktop'), maxDepth: 5, hot: true },
  { path: join(homedir(), 'Documents'), maxDepth: 5, hot: true },
  { path: join(homedir(), 'Downloads'), maxDepth: 4, hot: true },
  { path: join(homedir(), 'STUFF', 'Coding'), maxDepth: 6, hot: false }
] as const;
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
  '/System/Applications',
  join(homedir(), 'STUFF', 'Coding'),
  join(homedir(), 'Desktop'),
  join(homedir(), 'Documents'),
  join(homedir(), 'Downloads'),
  '/Applications'
];
let appPrivateRootsCache: string[] | null = null;

const execFileAsync = promisify(execFile);

type IndexedEntry = Omit<LocalSearchItem, 'score'>;
type CatalogEntry = IndexedEntry & {
  modifiedAt?: number | null;
  selectionCount?: number;
  lastSelectedAt?: number | null;
  providerId?: 'catalog';
};
type CatalogSnapshot = {
  entries: CatalogEntry[];
  totalCount?: number;
};
type RootConfig = {
  path: string;
  maxDepth: number;
};
type WalkNode = {
  path: string;
  depth: number;
  maxDepth: number;
  isDirectory: boolean;
};

type SearchTraceContext = {
  requestId?: string;
};

type SearchTier = 'all' | 'hot' | 'deep';
type ExistingRootsOptions = {
  tier?: SearchTier;
};
type TargetedSearchOptions = {
  roots?: RootConfig[];
  maxDepthCap?: number;
};

let fallbackIndex: CatalogEntry[] = [];
let fallbackIndexTotalCount = 0;
let fallbackIndexReady = false;
const hotQueryCache = new Map<string, LocalSearchItem[]>();
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

function cacheFilePath(filename = CATALOG_CACHE_FILENAME) {
  return join(app.getPath('userData'), filename);
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

function isAmbiguousFolderClassification(path: string, kind?: ResultKind) {
  if (path.endsWith('.app')) {
    return false;
  }

  return kind === 'folder' && !basename(path).includes('.');
}

export async function resolvePathKind(path: string, fallbackKind?: ResultKind): Promise<ResultKind> {
  if (path.endsWith('.app')) {
    return 'app';
  }

  try {
    const info = await stat(path);
    return info.isDirectory() ? 'folder' : 'file';
  } catch {
    return fallbackKind ?? (basename(path).includes('.') ? 'file' : 'folder');
  }
}

async function normalizeCatalogEntryKind<T extends CatalogEntry>(entry: T): Promise<T> {
  if (!isAmbiguousFolderClassification(entry.path, entry.kind)) {
    return entry;
  }

  const normalizedKind = await resolvePathKind(entry.path, entry.kind);
  return normalizedKind === entry.kind ? entry : { ...entry, kind: normalizedKind };
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

function estimatedItemsForScope(path: string) {
  return fallbackIndex.filter((entry) => entry.path === path || entry.path.startsWith(path.endsWith('/') ? path : `${path}/`)).length;
}

function classifyScopeCost(path: string, estimatedItems: number): ScopePerformanceInsight['cost'] {
  if (path === '/' || path === homedir() || path.includes('/Library') || estimatedItems > 25_000) {
    return 'high';
  }

  if (estimatedItems > 5_000 || /\/Users\/[^/]+$/.test(path)) {
    return 'medium';
  }

  return 'low';
}

function recommendationForScope(path: string, hot: boolean, cost: ScopePerformanceInsight['cost']) {
  if (cost === 'high') {
    return hot ? 'Fast Path may become slower here; better kept as deep search.' : 'Better kept as deep search.';
  }

  if (cost === 'medium') {
    return hot ? 'Useful as Fast Path if this is an everyday workspace.' : 'Good candidate for deep search unless you need very fast recall.';
  }

  return hot ? 'Good for Fast Path.' : 'Can be promoted to Fast Path if you use it daily.';
}

function systemPenalty(path: string) {
  if (path.startsWith('/System/Applications/') && path.endsWith('.app')) {
    return 0;
  }

  if (path.startsWith('/System/') || path.startsWith('/Library/')) {
    return 28;
  }

  if (path.includes('/Library/')) {
    return 14;
  }

  return 0;
}

function selectionBoost(entry: CatalogEntry | SearchProviderResult) {
  const selectionCount = ('metadata' in entry ? entry.metadata?.selectionCount : entry.selectionCount) ?? 0;
  const lastSelectedAt = ('metadata' in entry ? entry.metadata?.lastSelectedAt : entry.lastSelectedAt) ?? null;
  const recencyBoost = lastSelectedAt ? Math.max(0, 18 - Math.floor((Date.now() - lastSelectedAt) / (12 * 60 * 60 * 1000))) : 0;
  return Math.min(selectionCount * 8, 32) + recencyBoost;
}

function rankItem(query: string, entry: CatalogEntry | SearchProviderResult) {
  const settings = getLauncherStateSnapshot().settings;
  const textScore = composedSearchScore(query, entry, { appFirstEnabled: settings.appFirstEnabled });

  if (textScore === 0) {
    return 0;
  }

  const providerBoost = entry.providerId === 'spotlight' ? 10 : entry.providerId === 'catalog' ? 6 : 0;
  return (
    textScore +
    preferredBoost(entry.path) +
    providerBoost +
    selectionBoost(entry) -
    systemPenalty(entry.path) -
    Math.min(entry.path.split('/').length, 12)
  );
}

function filterByScope<T extends { path: string }>(items: T[], scopePath?: string | null) {
  if (!scopePath) {
    return items;
  }

  return items.filter((item) => item.path.startsWith(scopePath.endsWith('/') ? scopePath : `${scopePath}/`) || item.path === scopePath);
}

function filterByRoots<T extends { path: string }>(items: T[], roots: RootConfig[]) {
  if (roots.length === 0) {
    return [];
  }

  return items.filter((item) =>
    roots.some((root) => item.path === root.path || item.path.startsWith(root.path.endsWith('/') ? root.path : `${root.path}/`))
  );
}

function cacheKey(query: string, scopePath?: string | null, intent?: SearchIntent | null, tier: SearchTier = 'all') {
  return `${tier}::${scopePath ?? '__global__'}::${query.trim().toLowerCase()}::${searchIntentKey(intent)}`;
}

function defaultHotScope(path: string) {
  return DEFAULT_SCOPE_CONFIGS.some((scope) => scope.path === path && scope.hot);
}

function rootMatchesTier(hot: boolean, tier: SearchTier) {
  if (tier === 'hot') {
    return hot;
  }

  if (tier === 'deep') {
    return !hot;
  }

  return true;
}

async function existingRoots(scopePath?: string | null, options: ExistingRootsOptions = {}) {
  const tier = options.tier ?? 'all';

  if (scopePath) {
    try {
      await access(scopePath);
      if (tier === 'deep') {
        const settings = await getLauncherSettings();
        const matchingScope = settings.scopes.find((scope) => scope.path === scopePath);
        if (matchingScope?.hot ?? defaultHotScope(scopePath)) {
          return [];
        }
      }
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
          const hot = scope.hot ?? defaultHotScope(scope.path);
          if (!rootMatchesTier(hot, tier)) {
            return null;
          }

          return { path: scope.path, maxDepth: scope.path.endsWith('.app') ? 1 : hot ? 5 : 6 };
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
    DEFAULT_SCOPE_CONFIGS.filter((root) => rootMatchesTier(root.hot, tier)).map(async (root) => {
      try {
        await access(root.path);
        return { path: root.path, maxDepth: root.maxDepth };
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
    const parsed = JSON.parse(raw) as CatalogEntry[] | CatalogSnapshot;
    const entries = Array.isArray(parsed) ? parsed : parsed?.entries;
    const totalCount = Array.isArray(parsed) ? parsed.length : parsed?.totalCount ?? parsed?.entries?.length ?? 0;

    if (!Array.isArray(entries) || entries.length === 0) {
      throw new Error('empty-catalog');
    }

    fallbackIndex = await Promise.all(
      entries.slice(0, MAX_INDEX_ENTRIES).map(async (entry) =>
        normalizeCatalogEntryKind({
          ...entry,
          providerId: 'catalog'
        })
      )
    );
    fallbackIndexTotalCount = Math.max(totalCount, fallbackIndex.length);
    fallbackIndexReady = true;
    return true;
  } catch {
    try {
      const raw = await readFile(cacheFilePath(LEGACY_INDEX_CACHE_FILENAME), 'utf8');
      const parsed = JSON.parse(raw) as IndexedEntry[];

      if (!Array.isArray(parsed) || parsed.length === 0) {
        return false;
      }

      fallbackIndex = await Promise.all(
        parsed.slice(0, MAX_INDEX_ENTRIES).map(async (entry) =>
          normalizeCatalogEntryKind({
            ...entry,
            providerId: 'catalog'
          })
        )
      );
      fallbackIndexTotalCount = fallbackIndex.length;
      fallbackIndexReady = true;
      return true;
    } catch {
      return false;
    }
  }
}

async function persistIndex(nextIndex: CatalogEntry[], totalCount = fallbackIndexTotalCount || nextIndex.length) {
  if (nextIndex.length === 0) {
    return;
  }

  try {
    await mkdir(app.getPath('userData'), { recursive: true });
    const snapshot: CatalogSnapshot = {
      entries: nextIndex,
      totalCount
    };
    await writeFile(cacheFilePath(), JSON.stringify(snapshot), 'utf8');
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
  const removedCount = fallbackIndex.length - nextIndex.length;

  if (removedCount === 0) {
    return;
  }

  fallbackIndex = nextIndex;
  fallbackIndexTotalCount = Math.max(0, fallbackIndexTotalCount - removedCount);
  fallbackIndexReady = fallbackIndex.length > 0;
  queryCache.clear();
  hotQueryCache.clear();
  await persistIndex(fallbackIndex);
  notifyIndexChanged();
}

function searchFallbackIndex(query: string, scopePath?: string | null, intent?: SearchIntent | null) {
  const startedAt = Date.now();
  const normalizedQuery = query.trim();

  if (!fallbackIndexReady || normalizedQuery.length < 2) {
    recordTrace({
      subsystem: 'search',
      event: 'fallback-index-skip',
      query,
      scopePath,
      localFilter: intent?.localFilter,
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
    .filter((entry) => matchesLocalIntent(entry, intent?.localFilter))
    .filter((entry) => modifiedAtMatchesIntentTime(entry.modifiedAt, intent?.timeToken))
    .map((entry) => ({
      ...entry,
      providerId: 'catalog' as const,
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
    localFilter: intent?.localFilter,
    durationMs: Date.now() - startedAt,
    resultCount: results.length
  });

  return results;
}

function searchFallbackIndexInRoots(query: string, roots: RootConfig[], scopePath?: string | null, intent?: SearchIntent | null) {
  const startedAt = Date.now();
  const normalizedQuery = query.trim();

  if (!fallbackIndexReady || normalizedQuery.length < 2 || roots.length === 0) {
    recordTrace({
      subsystem: 'search',
      event: 'fallback-index-hot-skip',
      query,
      scopePath,
      localFilter: intent?.localFilter,
      durationMs: Date.now() - startedAt,
      resultCount: 0,
      details: {
        fallbackReady: fallbackIndexReady,
        tooShort: normalizedQuery.length < 2,
        rootCount: roots.length
      }
    });
    return [];
  }

  const results = filterByRoots(filterByScope(fallbackIndex, scopePath), roots)
    .filter((entry) => matchesLocalIntent(entry, intent?.localFilter))
    .filter((entry) => modifiedAtMatchesIntentTime(entry.modifiedAt, intent?.timeToken))
    .map((entry) => ({
      ...entry,
      providerId: 'catalog' as const,
      score: rankItem(normalizedQuery, entry)
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name))
    .slice(0, MAX_RESULTS);

  recordTrace({
    subsystem: 'search',
    event: 'fallback-index-hot-complete',
    query,
    scopePath,
    localFilter: intent?.localFilter,
    durationMs: Date.now() - startedAt,
    resultCount: results.length,
    details: {
      rootCount: roots.length
    }
  });

  return results;
}

async function walkForIndex(roots: RootConfig[]) {
  const queue: WalkNode[] = roots.map((root) => ({
    path: root.path,
    depth: 0,
    maxDepth: root.maxDepth,
    isDirectory: true
  }));
  const indexed: IndexedEntry[] = [];
  let totalCount = 0;

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current || isExcludedPath(current.path)) {
      continue;
    }

    const currentName = basename(current.path);

    if (current.depth > 0) {
      totalCount += 1;

      if (indexed.length < MAX_INDEX_ENTRIES) {
        const modifiedAt = await safeModifiedAt(current.path);
        indexed.push({
          id: current.path,
          path: current.path,
          name: currentName,
          kind: classifyPath(current.path, current.isDirectory),
          modifiedAt,
          providerId: 'catalog'
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

        if (entry.isDirectory() || entry.isFile() || entry.name.endsWith('.app')) {
          queue.push({
            path: nextPath,
            depth: current.depth + 1,
            maxDepth: current.maxDepth,
            isDirectory: entry.isDirectory() || entry.name.endsWith('.app')
          });
        }
      }
    } catch {
      continue;
    }
  }

  return {
    indexed,
    totalCount
  };
}

async function safeModifiedAt(path: string) {
  try {
    const stats = await stat(path);
    return stats.mtimeMs;
  } catch {
    return null;
  }
}

function resolveSearchScopePath(scopePath?: string | null, intent?: SearchIntent | null) {
  if (scopePath) {
    return scopePath;
  }

  const tokenScope = resolveIntentScopePath(intent?.scopeToken, intent?.scopePath, getLauncherStateSnapshot().settings.scopes);
  return tokenScope ?? scopePath ?? null;
}

async function searchSpotlightProvider(context: SearchContext): Promise<SearchProviderResult[]> {
  const startedAt = Date.now();
  const scopePath = resolveSearchScopePath(context.scopePath, context.intent);
  const roots = await existingRoots(scopePath);
  const uniquePaths = new Set<string>();

  if (roots.length === 0) {
    recordTrace({
      subsystem: 'provider',
      event: 'spotlight-skip',
      requestId: context.requestId,
      query: context.query,
      scopePath,
      localFilter: context.intent?.localFilter,
      durationMs: Date.now() - startedAt,
      resultCount: 0,
      details: {
        reason: 'no-roots'
      }
    });
    return [];
  }

  try {
    for (const root of roots) {
      const { stdout } = await execFileAsync('/usr/bin/mdfind', ['-onlyin', root.path, '-name', context.query], {
        timeout: SPOTLIGHT_TIMEOUT_MS,
        maxBuffer: 1024 * 1024 * 6
      });
      const lines = stdout
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, MAX_SPOTLIGHT_CANDIDATES);

      for (const line of lines) {
        uniquePaths.add(line);
      }
    }

    const candidates = await Promise.all(
      Array.from(uniquePaths)
        .slice(0, MAX_SPOTLIGHT_CANDIDATES)
        .map(async (path) => {
          if (isExcludedPath(path)) {
            return null;
          }

          const name = basename(path);
          const kind = await resolvePathKind(path);
          const candidate: SearchProviderResult = {
            id: path,
            path,
            name,
            kind,
            providerId: 'spotlight',
            modifiedAt: await safeModifiedAt(path),
            metadata: {
              extension: path.split('.').at(-1)?.toLowerCase() ?? null
            },
            score: 0
          };

          if (!matchesLocalIntent(candidate, context.intent?.localFilter)) {
            return null;
          }

          if (!modifiedAtMatchesIntentTime(candidate.modifiedAt, context.intent?.timeToken)) {
            return null;
          }

          candidate.score = rankItem(context.query, candidate);
          return candidate.score > 0 ? candidate : null;
        })
    );

    const results = candidates
      .filter((candidate): candidate is SearchProviderResult => Boolean(candidate))
      .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name))
      .slice(0, MAX_RESULTS * 2);

    recordTrace({
      subsystem: 'provider',
      event: 'spotlight-complete',
      requestId: context.requestId,
      query: context.query,
      scopePath,
      localFilter: context.intent?.localFilter,
      durationMs: Date.now() - startedAt,
      resultCount: results.length
    });
    return results;
  } catch (error) {
    recordTrace({
      subsystem: 'provider',
      event: 'spotlight-error',
      requestId: context.requestId,
      query: context.query,
      scopePath,
      localFilter: context.intent?.localFilter,
      durationMs: Date.now() - startedAt,
      outcome: 'error',
      details: {
        message: error instanceof Error ? error.message : String(error)
      }
    });
    return [];
  }
}

async function searchCatalogProvider(context: SearchContext): Promise<SearchProviderResult[]> {
  return searchFallbackIndex(context.query, resolveSearchScopePath(context.scopePath, context.intent), context.intent);
}

function mergeProviderResults(query: string, resultsByProvider: SearchProviderResult[][]) {
  const merged = new Map<string, SearchProviderResult>();

  for (const providerResults of resultsByProvider) {
    for (const result of providerResults) {
      const existing = merged.get(result.path);
      if (!existing || result.score > existing.score || (result.providerId === 'catalog' && existing.providerId !== 'catalog')) {
        merged.set(result.path, result);
      }
    }
  }

  return Array.from(merged.values())
    .map((result) => ({
      ...result,
      score: rankItem(query, result)
    }))
    .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name))
    .slice(0, MAX_RESULTS);
}

async function searchTargetedPaths(
  query: string,
  scopePath?: string | null,
  intent?: SearchIntent | null,
  traceContext: SearchTraceContext = {},
  options: TargetedSearchOptions = {}
) {
  const startedAt = Date.now();
  const roots = options.roots ?? (await existingRoots(resolveSearchScopePath(scopePath, intent)));

  if (roots.length === 0) {
    recordTrace({
      subsystem: 'search',
      event: 'targeted-search-skip',
      requestId: traceContext.requestId,
      query,
      scopePath,
      localFilter: intent?.localFilter,
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
    maxDepth: Math.min(root.maxDepth, options.maxDepthCap ?? 4),
    isDirectory: true
  }));
  const matches: LocalSearchItem[] = [];

  while (queue.length > 0 && matches.length < MAX_RESULTS * 4) {
    const current = queue.shift();

    if (!current || isExcludedPath(current.path)) {
      continue;
    }

    const currentName = basename(current.path);

    if (current.depth > 0) {
      const candidate: IndexedEntry = {
        id: current.path,
        path: current.path,
        name: currentName,
        kind: classifyPath(current.path, current.isDirectory)
      };
      const score = rankItem(query, candidate);

      if (score > 0 && matchesLocalIntent(candidate, intent?.localFilter)) {
        const modifiedAt = await safeModifiedAt(candidate.path);
        if (!modifiedAtMatchesIntentTime(modifiedAt, intent?.timeToken)) {
          continue;
        }
        matches.push({
          ...candidate,
          providerId: 'targeted',
          modifiedAt,
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
            maxDepth: current.maxDepth,
            isDirectory: entry.isDirectory() || entry.name.endsWith('.app')
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
    localFilter: intent?.localFilter,
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

    if (scanned.totalCount === 0) {
      recordTrace({
        subsystem: 'search',
        event: 'refresh-empty',
        durationMs: Date.now() - startedAt,
        resultCount: 0
      });
      return;
    }

    fallbackIndex = scanned.indexed.slice(0, MAX_INDEX_ENTRIES);
    fallbackIndexTotalCount = Math.max(scanned.totalCount, fallbackIndex.length);
    fallbackIndexReady = true;
    queryCache.clear();
    hotQueryCache.clear();
    await persistIndex(fallbackIndex, fallbackIndexTotalCount);
    notifyIndexChanged();
    recordTrace({
      subsystem: 'search',
      event: 'refresh-complete',
      durationMs: Date.now() - startedAt,
      resultCount: fallbackIndex.length,
      details: {
        totalCount: fallbackIndexTotalCount
      }
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
  }

  return restorePromise;
}

export function requestSearchRefresh() {
  scheduleRefresh();
}

export async function recordLocalSelection(item: Pick<LocalSearchItem, 'path' | 'name' | 'kind'>) {
  const existing = fallbackIndex.find((entry) => entry.path === item.path);
  const now = Date.now();

  if (existing) {
    existing.selectionCount = (existing.selectionCount ?? 0) + 1;
    existing.lastSelectedAt = now;
    existing.name = item.name;
    existing.kind = item.kind;
  } else {
    fallbackIndex.unshift({
      id: item.path,
      path: item.path,
      name: item.name,
      kind: item.kind,
      modifiedAt: await safeModifiedAt(item.path),
      selectionCount: 1,
      lastSelectedAt: now,
      providerId: 'catalog'
    });
    fallbackIndex = fallbackIndex.slice(0, MAX_INDEX_ENTRIES);
    fallbackIndexTotalCount += 1;
    fallbackIndexReady = true;
  }

  queryCache.clear();
  hotQueryCache.clear();
  await persistIndex(fallbackIndex);
}

function scheduleWatcherRefresh() {
  recordTrace({
    subsystem: 'watcher',
    event: 'schedule-watcher-refresh'
  });
  queryCache.clear();
  hotQueryCache.clear();
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
    indexEntryCount: fallbackIndexTotalCount || fallbackIndex.length,
    indexReady: fallbackIndexReady,
    isRestoring: isRestoringIndex,
    isRefreshing: refreshPromise !== null,
    searchMode: 'hybrid',
    catalogState: isRestoringIndex ? 'restoring' : refreshPromise ? 'hydrating' : fallbackIndexReady ? 'ready' : 'cold'
  };
}

export async function getScopeInsights(): Promise<ScopePerformanceInsight[]> {
  await warmSearchIndex();
  const settings = await getLauncherSettings();

  return settings.scopes.map((scope) => {
    const estimatedItems = estimatedItemsForScope(scope.path);
    const cost = classifyScopeCost(scope.path, estimatedItems);

    return {
      id: scope.id,
      path: scope.path,
      enabled: scope.enabled,
      hot: scope.hot,
      estimatedItems,
      cost,
      recommendation: recommendationForScope(scope.path, scope.hot, cost)
    };
  });
}

export async function searchHotPaths(
  query: string,
  scopePath?: string | null,
  intent?: SearchIntent | null,
  traceContext: SearchTraceContext = {}
): Promise<LocalSearchItem[]> {
  const startedAt = Date.now();
  const trimmed = query.trim();

  if (trimmed.length < 2) {
    recordTrace({
      subsystem: 'search',
      event: 'search-hot-skip',
      requestId: traceContext.requestId,
      query,
      scopePath,
      localFilter: intent?.localFilter,
      durationMs: Date.now() - startedAt,
      resultCount: 0,
      details: {
        reason: 'too-short'
      }
    });
    return [];
  }

  await warmSearchIndex();

  const key = cacheKey(trimmed, scopePath, intent, 'hot');
  const cached = hotQueryCache.get(key);

  if (cached) {
    recordTrace({
      subsystem: 'search',
      event: 'search-hot-complete',
      requestId: traceContext.requestId,
      query,
      scopePath,
      localFilter: intent?.localFilter,
      durationMs: Date.now() - startedAt,
      resultCount: cached.length,
      cacheState: 'hit',
      details: {
        source: 'query-cache'
      }
    });
    return cached;
  }

  const resolvedScopePath = resolveSearchScopePath(scopePath, intent);
  const roots = await existingRoots(resolvedScopePath, { tier: 'hot' });

  if (roots.length === 0) {
    recordTrace({
      subsystem: 'search',
      event: 'search-hot-complete',
      requestId: traceContext.requestId,
      query,
      scopePath,
      localFilter: intent?.localFilter,
      durationMs: Date.now() - startedAt,
      resultCount: 0,
      cacheState: 'miss',
      details: {
        source: 'empty-roots'
      }
    });
    return [];
  }

  const indexedResults = searchFallbackIndexInRoots(trimmed, roots, resolvedScopePath, intent);
  const { results: existingIndexed, removedPaths } = await stripMissingResults(indexedResults);

  if (removedPaths.length > 0) {
    await pruneMissingEntries(removedPaths);
  }

  if (existingIndexed.length > 0) {
    hotQueryCache.set(key, existingIndexed);
    recordTrace({
      subsystem: 'search',
      event: 'search-hot-complete',
      requestId: traceContext.requestId,
      query,
      scopePath,
      localFilter: intent?.localFilter,
      durationMs: Date.now() - startedAt,
      resultCount: existingIndexed.length,
      cacheState: 'miss',
      details: {
        source: 'catalog-hot'
      }
    });
    return existingIndexed;
  }

  const targetedResults = await searchTargetedPaths(trimmed, scopePath, intent, traceContext, {
    roots,
    maxDepthCap: 3
  });
  const { results: existingTargeted } = await stripMissingResults(targetedResults);

  if (existingTargeted.length > 0) {
    hotQueryCache.set(key, existingTargeted);
  }

  recordTrace({
    subsystem: 'search',
    event: 'search-hot-complete',
    requestId: traceContext.requestId,
    query,
    scopePath,
    localFilter: intent?.localFilter,
    durationMs: Date.now() - startedAt,
    resultCount: existingTargeted.length,
    cacheState: 'miss',
    details: {
      source: existingTargeted.length > 0 ? 'targeted-hot' : 'empty'
    }
  });

  return existingTargeted;
}

export async function searchIndexedPaths(
  query: string,
  scopePath?: string | null,
  intent?: SearchIntent | null,
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
      localFilter: intent?.localFilter,
      durationMs: Date.now() - startedAt,
      resultCount: 0,
      details: {
        reason: 'too-short'
      }
    });
    return [];
  }

  await warmSearchIndex();

  const key = cacheKey(trimmed, scopePath, intent);
  const cached = queryCache.get(key);

  if (cached) {
    recordTrace({
      subsystem: 'search',
      event: 'search-complete',
      requestId: traceContext.requestId,
      query,
      scopePath,
      localFilter: intent?.localFilter,
      durationMs: Date.now() - startedAt,
      resultCount: cached.length,
      cacheState: 'hit',
      details: {
        source: 'query-cache'
      }
    });
    return cached;
  }

  const context: SearchContext = {
    query: trimmed,
    scopePath,
    intent,
    requestId: traceContext.requestId
  };
  const providers: SearchProvider[] = [
    {
      id: 'catalog',
      kind: 'catalog',
      supports: () => fallbackIndexReady,
      search: searchCatalogProvider
    },
    {
      id: 'spotlight',
      kind: 'spotlight',
      supports: () => process.platform === 'darwin',
      search: searchSpotlightProvider
    }
  ];
  const providerResults = await Promise.all(providers.filter((provider) => provider.supports(context)).map((provider) => provider.search(context)));
  const mergedResults = mergeProviderResults(trimmed, providerResults);
  const { results: existingMerged, removedPaths } = await stripMissingResults(mergedResults);

  if (removedPaths.length > 0) {
    await pruneMissingEntries(removedPaths);
  }

  if (existingMerged.length > 0) {
    queryCache.set(key, existingMerged);
    recordTrace({
      subsystem: 'search',
      event: 'search-complete',
      requestId: traceContext.requestId,
      query,
      scopePath,
      localFilter: intent?.localFilter,
      durationMs: Date.now() - startedAt,
      resultCount: existingMerged.length,
      cacheState: 'miss',
      details: {
        source: 'hybrid-provider'
      }
    });
    return existingMerged;
  }

  const targetedResults = await searchTargetedPaths(trimmed, scopePath, intent, traceContext);
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
        localFilter: intent?.localFilter,
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
    localFilter: intent?.localFilter,
    durationMs: Date.now() - startedAt,
    resultCount: 0,
    cacheState: 'miss',
    details: {
      source: 'empty'
    }
  });
  return [];
}
