import { app, clipboard } from 'electron';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { ClipboardEntry, LauncherSettings, ScopeEntry, SnippetEntry, AliasEntry } from '../src/lib/search/types';

type LauncherState = {
  settings: LauncherSettings;
  clipboardHistory: ClipboardEntry[];
};

const SETTINGS_FILENAME = 'launcher-state.json';
const DEFAULT_SCOPE_PATHS = [
  '/Applications',
  join(homedir(), 'Applications'),
  join(homedir(), 'Desktop'),
  join(homedir(), 'Documents'),
  join(homedir(), 'Downloads'),
  join(homedir(), 'STUFF', 'Coding')
];

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
  scopes: DEFAULT_SCOPE_PATHS.map((path, index) => ({ id: `scope-${index}`, path, enabled: true })),
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

function stateFilePath() {
  return join(app.getPath('userData'), SETTINGS_FILENAME);
}

function normalizeScopes(scopes: ScopeEntry[] | undefined) {
  if (!Array.isArray(scopes) || scopes.length === 0) {
    return DEFAULT_SETTINGS.scopes;
  }

  return scopes
    .filter((scope) => typeof scope?.path === 'string' && scope.path.trim().length > 0)
    .map((scope, index) => ({
      id: scope.id || `scope-${index}`,
      path: scope.path.trim(),
      enabled: scope.enabled !== false
    }));
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
    clipboardHistory: normalizeClipboardHistory(input?.clipboardHistory, settings.maxClipboardItems)
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
    void ensureLauncherState().then((state) => {
      if (!state.settings.clipboardHistoryEnabled) {
        return;
      }

      const text = clipboard.readText();
      if (!text || text === lastClipboardText) {
        return;
      }

      lastClipboardText = text;
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
