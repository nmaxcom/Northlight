import type { ReactNode } from 'react';

export type ResultKind = 'file' | 'folder' | 'conversion' | 'app' | 'command' | 'clipboard' | 'snippet' | 'alias';

export type AliasTargetType = 'path' | 'snippet' | 'settings';

export type AliasEntry = {
  id: string;
  trigger: string;
  targetType: AliasTargetType;
  target: string;
  note?: string;
};

export type SnippetEntry = {
  id: string;
  trigger: string;
  content: string;
  note?: string;
};

export type ScopeEntry = {
  id: string;
  path: string;
  enabled: boolean;
};

export type ClipboardEntry = {
  id: string;
  text: string;
  copiedAt: number;
};

export type LauncherPosition = {
  x: number;
  y: number;
};

export type LauncherSettings = {
  aliases: AliasEntry[];
  snippets: SnippetEntry[];
  scopes: ScopeEntry[];
  watchFsChangesEnabled: boolean;
  previewEnabled: boolean;
  clipboardHistoryEnabled: boolean;
  snippetsEnabled: boolean;
  bestMatchEnabled: boolean;
  appFirstEnabled: boolean;
  quickLookEnabled: boolean;
  quickLookStartsOpen: boolean;
  maxClipboardItems: number;
  launcherHotkey: string;
  launcherPosition: LauncherPosition | null;
};

export type PreviewSection = {
  label: string;
  value: string;
};

export type LauncherPreview = {
  title: string;
  subtitle: string;
  body?: string;
  bodyMode?: 'plain' | 'code';
  mediaUrl?: string;
  mediaAlt?: string;
  mediaKind?: 'image' | 'document';
  sections: PreviewSection[];
};

export type LocalSearchItem = {
  id: string;
  path: string;
  name: string;
  kind: Extract<ResultKind, 'file' | 'folder' | 'app'>;
  score: number;
};

export type LauncherAction = {
  id: string;
  label: string;
  hint: string;
  group?: string;
  feedbackLabel?: string;
  dismissOnRun?: boolean;
  run: () => Promise<void> | void;
};

export type LauncherStatus = {
  appVersion: string;
  indexEntryCount: number;
  indexReady: boolean;
  isRestoring: boolean;
  isRefreshing: boolean;
};

export type LauncherTraceEvent = {
  subsystem: string;
  event: string;
  requestId?: string;
  query?: string | null;
  scopePath?: string | null;
  localFilter?: {
    kind?: LocalSearchItem['kind'];
    extensions?: string[];
  } | null;
  durationMs?: number;
  resultCount?: number;
  cacheState?: 'hit' | 'miss' | 'mixed';
  path?: string | null;
  kind?: string;
  outcome?: string;
  details?: Record<string, string | number | boolean | null> | null;
  timestamp?: number;
};

export type LauncherTraceState = {
  enabled: boolean;
  sessionId: string;
};

export type LauncherTraceIdleSummary = {
  fromTimestamp: number;
  toTimestamp: number;
  idleMs: number;
  totalEvents: number;
  uniqueEventCount: number;
  topEvents: Array<{
    key: string;
    count: number;
    totalDurationMs: number;
  }>;
};

export type LauncherTraceDump = {
  enabled: boolean;
  sessionId: string;
  generatedAt: number;
  events: Array<{
    id: string;
    sessionId: string;
    timestamp: number;
    source: 'main' | 'renderer';
    subsystem: string;
    event: string;
    requestId?: string;
    queryHash?: string;
    queryLength?: number;
    scopeHash?: string;
    localFilter?: string;
    durationMs?: number;
    resultCount?: number;
    cacheState?: 'hit' | 'miss' | 'mixed';
    pathHash?: string;
    kind?: string;
    outcome?: string;
    details?: Record<string, string | number | boolean | null>;
  }>;
};

export type LauncherTraceDumpFile = {
  path: string;
  sessionId: string;
  eventCount: number;
  generatedAt: number;
};

export type LauncherResult = {
  id: string;
  title: string;
  subtitle: string;
  value?: string;
  icon: ReactNode;
  kind: ResultKind;
  score: number;
  path?: string;
  preview?: LauncherPreview;
  source?: 'local' | 'alias' | 'clipboard' | 'snippet' | 'conversion' | 'command';
  actions: LauncherAction[];
};

export type LauncherBridge = {
  searchLocal: (
    query: string,
    scopePath?: string | null,
    localFilter?: {
      kind?: LocalSearchItem['kind'];
      extensions?: string[];
    } | null,
    requestId?: string
  ) => Promise<LocalSearchItem[]>;
  getStatus: (requestId?: string) => Promise<LauncherStatus>;
  getSettings: () => Promise<LauncherSettings>;
  getEffectiveShortcut?: () => Promise<string>;
  saveSettings: (settings: LauncherSettings) => Promise<LauncherSettings>;
  getClipboardHistory: () => Promise<ClipboardEntry[]>;
  openSettings: () => Promise<void>;
  getPathPreview: (path: string, kind: LocalSearchItem['kind'], requestId?: string) => Promise<LauncherPreview | null>;
  getPathIcon: (path: string, requestId?: string) => Promise<string | null>;
  getPathIcons?: (paths: string[], requestId?: string) => Promise<Record<string, string | null>>;
  getTraceState?: () => Promise<LauncherTraceState>;
  setTraceEnabled?: (enabled: boolean) => Promise<LauncherTraceState>;
  traceEvent?: (event: LauncherTraceEvent) => Promise<void>;
  getTraceDump?: () => Promise<LauncherTraceDump>;
  getIdleTraceSummary?: () => Promise<LauncherTraceIdleSummary>;
  writeTraceDump?: () => Promise<LauncherTraceDumpFile>;
  quickLookPath: (path: string) => Promise<void>;
  onSettingsChanged?: (callback: (settings: LauncherSettings) => void) => () => void;
  onIndexChanged?: (callback: () => void) => () => void;
  openPath: (path: string) => Promise<void>;
  revealPath: (path: string) => Promise<void>;
  openInTerminal: (path: string) => Promise<void>;
  openWithTextEdit: (path: string) => Promise<void>;
  trashPath: (path: string) => Promise<void>;
  hide: () => Promise<void>;
  ready: () => Promise<void>;
};
