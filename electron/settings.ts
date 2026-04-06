import { app, clipboard } from 'electron';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type {
  ClipboardEntry,
  LauncherSettings,
  ScopeEntry,
  SnippetEntry,
  AliasEntry,
  SearchPerformanceSample,
  SearchPerformanceSummary
} from '../src/lib/search/types';
import { DEFAULT_LAUNCHER_THEME_ID, normalizeLauncherThemeId } from '../src/launcherTheme';
import { recordTrace } from './diagnostics';

type LauncherState = {
  settings: LauncherSettings;
  clipboardHistory: ClipboardEntry[];
  searchPerformance: SearchPerformanceSample[];
};

const SETTINGS_FILENAME = 'launcher-state.json';
const SYSTEM_APPLICATIONS_PATH = '/System/Applications';
const DEFAULT_SCOPE_CONFIGS = [
  { path: '/Applications', hot: true },
  { path: SYSTEM_APPLICATIONS_PATH, hot: true },
  { path: join(homedir(), 'Applications'), hot: true },
  { path: join(homedir(), 'Desktop'), hot: true },
  { path: join(homedir(), 'Documents'), hot: true },
  { path: join(homedir(), 'Downloads'), hot: true },
  { path: join(homedir(), 'STUFF', 'Coding'), hot: false }
] as const;

const DEFAULT_ALIASES: AliasEntry[] = [
  { id: 'alias-btt', trigger: 'btt', targetType: 'path', target: '/Applications/BetterTouchTool.app', note: 'BetterTouchTool' },
  { id: 'alias-settings', trigger: 'prefs', targetType: 'settings', target: 'settings', note: 'Open Northlight settings' }
];

const DEFAULT_SNIPPETS: SnippetEntry[] = [
  {
    id: 'snippet-steel-review',
    trigger: 'steel-review',
    content: 'Review the launcher UX for speed, hierarchy, and keyboard affordances.',
    note: 'Launcher review checklist'
  }
];

const DEFAULT_SETTINGS: LauncherSettings = {
  aliases: DEFAULT_ALIASES,
  snippets: DEFAULT_SNIPPETS,
  scopes: DEFAULT_SCOPE_CONFIGS.map(({ path, hot }, index) => ({ id: `scope-${index}`, path, enabled: true, hot })),
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

let stateCache: LauncherState | null = null;
let clipboardMonitor: ReturnType<typeof setInterval> | null = null;
let lastClipboardText = '';
const MAX_SEARCH_PERFORMANCE_SAMPLES = 60;

function stateFilePath() {
  return join(app.getPath('userData'), SETTINGS_FILENAME);
}

function normalizeScopes(scopes: ScopeEntry[] | undefined) {
  const baseScopes =
    !Array.isArray(scopes) || scopes.length === 0
      ? DEFAULT_SETTINGS.scopes
      : scopes
          .filter((scope) => typeof scope?.path === 'string' && scope.path.trim().length > 0)
          .map((scope, index) => ({
            id: scope.id || `scope-${index}`,
            path: scope.path.trim(),
            enabled: scope.enabled !== false,
            hot:
              typeof scope.hot === 'boolean'
                ? scope.hot
                : DEFAULT_SCOPE_CONFIGS.some((entry) => entry.path === scope.path.trim() && entry.hot)
          }));

  const hasSystemApplications = baseScopes.some((scope) => scope.path === SYSTEM_APPLICATIONS_PATH);

  if (hasSystemApplications) {
    return baseScopes;
  }

  return [
    ...baseScopes,
    {
      id: `scope-${baseScopes.length}`,
      path: SYSTEM_APPLICATIONS_PATH,
      enabled: true,
      hot: true
    }
  ];
}

function normalizeAliases(aliases: AliasEntry[] | undefined) {
  if (!Array.isArray(aliases) || aliases.length === 0) {
    return DEFAULT_SETTINGS.aliases;
  }

  return aliases
    .filter((alias) => typeof alias?.trigger === 'string' && typeof alias?.target === 'string' && alias.trigger.trim() && alias.target.trim())
    .map((alias, index) => ({
      id: alias.id || `alias-${index}`,
      trigger: alias.trigger.trim(),
      targetType: alias.targetType,
      target: alias.target.trim(),
      note: alias.note?.trim() || ''
    }));
}

function normalizeSnippets(snippets: SnippetEntry[] | undefined) {
  if (!Array.isArray(snippets) || snippets.length === 0) {
    return DEFAULT_SETTINGS.snippets;
  }

  return snippets
    .filter((snippet) => typeof snippet?.trigger === 'string' && typeof snippet?.content === 'string' && snippet.trigger.trim() && snippet.content.trim())
    .map((snippet, index) => ({
      id: snippet.id || `snippet-${index}`,
      trigger: snippet.trigger.trim(),
      content: snippet.content,
      note: snippet.note?.trim() || ''
    }));
}

function normalizeClipboardHistory(history: ClipboardEntry[] | undefined, maxItems: number) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter((entry) => typeof entry?.text === 'string' && entry.text.trim().length > 0)
    .slice(0, maxItems)
    .map((entry, index) => ({
      id: entry.id || `clip-${index}`,
      text: entry.text,
      copiedAt: Number(entry.copiedAt) || Date.now()
    }));
}

function normalizeSearchPerformance(samples: SearchPerformanceSample[] | undefined) {
  if (!Array.isArray(samples)) {
    return [];
  }

  return samples
    .filter((sample) => typeof sample?.query === 'string' && sample.query.trim().length > 0)
    .slice(0, MAX_SEARCH_PERFORMANCE_SAMPLES)
    .map((sample, index) => ({
      id: sample.id || `perf-${index}`,
      query: sample.query.trim(),
      recordedAt: Number(sample.recordedAt) || Date.now(),
      firstVisibleMs: typeof sample.firstVisibleMs === 'number' ? sample.firstVisibleMs : null,
      firstUsefulMs: typeof sample.firstUsefulMs === 'number' ? sample.firstUsefulMs : null,
      hotCompleteMs: typeof sample.hotCompleteMs === 'number' ? sample.hotCompleteMs : null,
      deepCompleteMs: typeof sample.deepCompleteMs === 'number' ? sample.deepCompleteMs : null,
      hotResultCount: Math.max(0, Number(sample.hotResultCount) || 0),
      deepResultCount: Math.max(0, Number(sample.deepResultCount) || 0),
      topReplacementCount: Math.max(0, Number(sample.topReplacementCount) || 0),
      clipboardFirstFlash: sample.clipboardFirstFlash === true
    }));
}

function normalizeLauncherHotkey(hotkey?: string) {
  const trimmed = hotkey?.trim();
  if (!trimmed) {
    return '';
  }

  return trimmed
    .split('+')
    .map((part) => {
      const token = part.trim().toLowerCase();

      if (token === 'cmd' || token === 'command' || token === 'commandorcontrol' || token === 'cmdorctrl') {
        return 'CommandOrControl';
      }

      if (token === 'ctrl' || token === 'control') {
        return 'Control';
      }

      if (token === 'alt' || token === 'option') {
        return 'Alt';
      }

      if (token === 'esc') {
        return 'Escape';
      }

      if (token === 'del') {
        return 'Delete';
      }

      if (token === 'spacebar' || token === 'space') {
        return 'Space';
      }

      if (token === 'comma') {
        return ',';
      }

      if (token.length === 1) {
        return token.toUpperCase();
      }

      return token.charAt(0).toUpperCase() + token.slice(1);
    })
    .join('+');
}

function normalizeSettings(input?: Partial<LauncherSettings>): LauncherSettings {
  const normalizedPosition =
    typeof input?.launcherPosition?.x === 'number' && typeof input?.launcherPosition?.y === 'number'
      ? {
          x: Math.round(input.launcherPosition.x),
          y: Math.round(input.launcherPosition.y)
        }
      : null;

  return {
    aliases: normalizeAliases(input?.aliases),
    snippets: normalizeSnippets(input?.snippets),
    scopes: normalizeScopes(input?.scopes),
    launcherThemeId: normalizeLauncherThemeId(input?.launcherThemeId),
    watchFsChangesEnabled: input?.watchFsChangesEnabled ?? DEFAULT_SETTINGS.watchFsChangesEnabled,
    previewEnabled: input?.previewEnabled ?? DEFAULT_SETTINGS.previewEnabled,
    clipboardHistoryEnabled: input?.clipboardHistoryEnabled ?? DEFAULT_SETTINGS.clipboardHistoryEnabled,
    snippetsEnabled: input?.snippetsEnabled ?? DEFAULT_SETTINGS.snippetsEnabled,
    bestMatchEnabled: input?.bestMatchEnabled ?? DEFAULT_SETTINGS.bestMatchEnabled,
    appFirstEnabled: input?.appFirstEnabled ?? DEFAULT_SETTINGS.appFirstEnabled,
    quickLookEnabled: input?.quickLookEnabled ?? DEFAULT_SETTINGS.quickLookEnabled,
    quickLookStartsOpen: input?.quickLookStartsOpen ?? DEFAULT_SETTINGS.quickLookStartsOpen,
    maxClipboardItems: Math.min(Math.max(input?.maxClipboardItems ?? DEFAULT_SETTINGS.maxClipboardItems, 5), 50),
    launcherHotkey: normalizeLauncherHotkey(input?.launcherHotkey),
    launcherPosition: normalizedPosition
  };
}

function normalizeState(input?: Partial<LauncherState>): LauncherState {
  const settings = normalizeSettings(input?.settings);

  return {
    settings,
    clipboardHistory: normalizeClipboardHistory(input?.clipboardHistory, settings.maxClipboardItems),
    searchPerformance: normalizeSearchPerformance(input?.searchPerformance)
  };
}

function average(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1));
}

function p95(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * 0.95) - 1));
  return Number(sorted[index].toFixed(1));
}

export function summarizeSearchPerformance(samples: SearchPerformanceSample[]): SearchPerformanceSummary {
  const hotValues = samples.flatMap((sample) => (typeof sample.hotCompleteMs === 'number' ? [sample.hotCompleteMs] : []));
  const deepValues = samples.flatMap((sample) => (typeof sample.deepCompleteMs === 'number' ? [sample.deepCompleteMs] : []));
  const firstVisibleValues = samples.flatMap((sample) => (typeof sample.firstVisibleMs === 'number' ? [sample.firstVisibleMs] : []));
  const firstUsefulValues = samples.flatMap((sample) => (typeof sample.firstUsefulMs === 'number' ? [sample.firstUsefulMs] : []));
  const replacementSamples = samples.filter((sample) => sample.topReplacementCount > 0).length;
  const clipboardFlashSamples = samples.filter((sample) => sample.clipboardFirstFlash).length;

  return {
    sampleCount: samples.length,
    hotAverageMs: average(hotValues),
    hotP95Ms: p95(hotValues),
    deepAverageMs: average(deepValues),
    deepP95Ms: p95(deepValues),
    firstVisibleAverageMs: average(firstVisibleValues),
    firstUsefulAverageMs: average(firstUsefulValues),
    topReplacementRate: samples.length > 0 ? Number((replacementSamples / samples.length).toFixed(3)) : 0,
    clipboardFirstFlashRate: samples.length > 0 ? Number((clipboardFlashSamples / samples.length).toFixed(3)) : 0,
    lastRecordedAt: samples[0]?.recordedAt ?? null
  };
}

async function persistState() {
  if (!stateCache) {
    return;
  }

  try {
    await mkdir(app.getPath('userData'), { recursive: true });
    await writeFile(stateFilePath(), JSON.stringify(stateCache, null, 2), 'utf8');
  } catch {
    // Keep in-memory state if persistence fails.
  }
}

export async function ensureLauncherState() {
  if (stateCache) {
    return stateCache;
  }

  try {
    const raw = await readFile(stateFilePath(), 'utf8');
    stateCache = normalizeState(JSON.parse(raw) as LauncherState);
  } catch {
    stateCache = normalizeState();
  }

  return stateCache;
}

export function getLauncherStateSnapshot() {
  return stateCache ?? normalizeState();
}

export async function getLauncherSettings() {
  return (await ensureLauncherState()).settings;
}

export async function saveLauncherSettings(settings: LauncherSettings) {
  const current = await ensureLauncherState();
  stateCache = normalizeState({
    ...current,
    settings
  });
  await persistState();
  return stateCache.settings;
}

export async function getClipboardHistory() {
  return (await ensureLauncherState()).clipboardHistory;
}

export async function getSearchPerformance() {
  const current = await ensureLauncherState();
  return {
    samples: current.searchPerformance,
    summary: summarizeSearchPerformance(current.searchPerformance)
  };
}

export async function recordSearchPerformanceSample(sample: Omit<SearchPerformanceSample, 'id' | 'recordedAt'>) {
  const current = await ensureLauncherState();
  const nextSamples = normalizeSearchPerformance([
    {
      ...sample,
      id: `perf-${Date.now()}`,
      recordedAt: Date.now()
    },
    ...current.searchPerformance
  ]).slice(0, MAX_SEARCH_PERFORMANCE_SAMPLES);

  stateCache = {
    ...current,
    searchPerformance: nextSamples
  };
  await persistState();
}

async function pushClipboardText(text: string) {
  const current = await ensureLauncherState();
  const trimmed = text.trim();

  if (!trimmed || !current.settings.clipboardHistoryEnabled) {
    return;
  }

  const nextHistory = [
    {
      id: `clip-${Date.now()}`,
      text: trimmed,
      copiedAt: Date.now()
    },
    ...current.clipboardHistory.filter((entry) => entry.text !== trimmed)
  ].slice(0, current.settings.maxClipboardItems);

  stateCache = {
    ...current,
    clipboardHistory: nextHistory
  };
  await persistState();
}

export async function validateScopePaths(settings: LauncherSettings) {
  return Promise.all(
    settings.scopes.map(async (scope) => {
      try {
        await access(scope.path);
        return { ...scope, valid: true };
      } catch {
        return { ...scope, valid: false };
      }
    })
  );
}

export function startClipboardMonitor() {
  if (clipboardMonitor) {
    return;
  }

  clipboardMonitor = setInterval(() => {
    const startedAt = Date.now();
    void ensureLauncherState().then((state) => {
      if (!state.settings.clipboardHistoryEnabled) {
        recordTrace({
          subsystem: 'clipboard',
          event: 'poll-skip',
          durationMs: Date.now() - startedAt,
          details: {
            reason: 'disabled'
          }
        });
        return;
      }

      const text = clipboard.readText();
      if (!text || text === lastClipboardText) {
        recordTrace({
          subsystem: 'clipboard',
          event: 'poll-idle',
          durationMs: Date.now() - startedAt
        });
        return;
      }

      lastClipboardText = text;
      recordTrace({
        subsystem: 'clipboard',
        event: 'poll-change',
        durationMs: Date.now() - startedAt,
        details: {
          textLength: text.length
        }
      });
      void pushClipboardText(text);
    });
  }, 2500);
}

export function stopClipboardMonitor() {
  if (clipboardMonitor) {
    clearInterval(clipboardMonitor);
    clipboardMonitor = null;
  }
}
