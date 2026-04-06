import type { ReactNode } from 'react';
import type { LauncherThemeId } from '../../launcherTheme';

export type ResultKind = 'file' | 'folder' | 'conversion' | 'app' | 'command' | 'clipboard' | 'snippet' | 'alias';
export type SearchProviderKind = 'spotlight' | 'catalog' | 'deterministic' | 'targeted';
export type SearchScopeToken = 'downloads' | 'documents' | 'desktop' | 'library' | 'home';
export type SearchTimeToken = 'today' | 'yesterday' | 'recent';

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
  hot: boolean;
};

export type ClipboardEntry = {
  id: string;
  text: string;
  copiedAt: number;
};

export type SearchPerformanceSample = {
  id: string;
  query: string;
  recordedAt: number;
  firstVisibleMs: number | null;
  firstUsefulMs: number | null;
  hotCompleteMs: number | null;
  deepCompleteMs: number | null;
  hotResultCount: number;
  deepResultCount: number;
  topReplacementCount: number;
  clipboardFirstFlash: boolean;
};

export type SearchPerformanceSummary = {
  sampleCount: number;
  hotAverageMs: number | null;
  hotP95Ms: number | null;
  deepAverageMs: number | null;
  deepP95Ms: number | null;
  firstVisibleAverageMs: number | null;
  firstUsefulAverageMs: number | null;
  topReplacementRate: number;
  clipboardFirstFlashRate: number;
  lastRecordedAt: number | null;
};

export type ScopeCostLevel = 'low' | 'medium' | 'high';

export type ScopePerformanceInsight = {
  id: string;
  path: string;
  enabled: boolean;
  hot: boolean;
  estimatedItems: number;
  cost: ScopeCostLevel;
  recommendation: string;
};

export type LauncherPosition = {
  x: number;
  y: number;
};

export type LauncherSettings = {
  aliases: AliasEntry[];
  snippets: SnippetEntry[];
  scopes: ScopeEntry[];
  launcherThemeId: LauncherThemeId;
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
  providerId?: SearchProviderKind;
  modifiedAt?: number | null;
  metadata?: {
    extension?: string | null;
    selectionCount?: number;
    lastSelectedAt?: number | null;
    primaryActionId?: string | null;
  };
};

export type LocalIntentFilter = {
  kind?: LocalSearchItem['kind'];
  extensions?: string[];
};

export type SearchIntent = {
  localFilter: LocalIntentFilter | null;
  scopeToken?: SearchScopeToken;
  scopePath?: string;
  timeToken?: SearchTimeToken;
  matchedTokens: string[];
};

export type SearchContext = {
  query: string;
  scopePath?: string | null;
  intent: SearchIntent | null;
  requestId?: string;
};

export type SearchProviderResult = Omit<LocalSearchItem, 'score'> & {
  providerId: SearchProviderKind;
  score: number;
};

export type SearchProvider = {
  id: SearchProviderKind;
  kind: SearchProviderKind;
  supports: (context: SearchContext) => boolean;
  search: (context: SearchContext) => Promise<SearchProviderResult[]>;
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

export type ActionDescriptor =
  | {
      id: 'open';
      label: string;
      hint: string;
      group?: string;
      feedbackLabel?: string;
      dismissOnRun?: boolean;
      targetPath: string;
      resultKind: Extract<ResultKind, 'file' | 'folder' | 'app'>;
    }
  | {
      id: 'reveal';
      label: string;
      hint: string;
      group?: string;
      feedbackLabel?: string;
      dismissOnRun?: boolean;
      targetPath: string;
    }
  | {
      id: 'open-terminal';
      label: string;
      hint: string;
      group?: string;
      feedbackLabel?: string;
      dismissOnRun?: boolean;
      targetPath: string;
    }
  | {
      id: 'open-with-text-edit';
      label: string;
      hint: string;
      group?: string;
      feedbackLabel?: string;
      dismissOnRun?: boolean;
      targetPath: string;
    }
  | {
      id: 'quick-look';
      label: string;
      hint: string;
      group?: string;
      feedbackLabel?: string;
      dismissOnRun?: boolean;
      targetPath: string;
    }
  | {
      id: 'copy-path' | 'copy-name' | 'copy-markdown-link' | 'copy-result' | 'copy-full-expression' | 'copy-snippet' | 'copy-clipboard';
      label: string;
      hint: string;
      group?: string;
      feedbackLabel?: string;
      dismissOnRun?: boolean;
      text: string;
    }
  | {
      id: 'open-settings';
      label: string;
      hint: string;
      group?: string;
      feedbackLabel?: string;
      dismissOnRun?: boolean;
    }
  | {
      id: 'open-system-settings';
      label: string;
      hint: string;
      group?: string;
      feedbackLabel?: string;
      dismissOnRun?: boolean;
      url: string;
      fallbackLabel?: string;
    };

export type LauncherStatus = {
  appVersion: string;
  indexEntryCount: number;
  indexReady: boolean;
  isRestoring: boolean;
  isRefreshing: boolean;
  searchMode?: 'hybrid' | 'catalog' | 'fallback';
  catalogState?: 'cold' | 'restoring' | 'hydrating' | 'ready';
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
  iconUrl?: string;
  iconPath?: string;
  kind: ResultKind;
  score: number;
  path?: string;
  preview?: LauncherPreview;
  source?: 'local' | 'alias' | 'clipboard' | 'snippet' | 'conversion' | 'command';
  actions: LauncherAction[];
};

export type LauncherBridge = {
  searchLocalHot?: (
    query: string,
    scopePath?: string | null,
    intent?: SearchIntent | null,
    requestId?: string
  ) => Promise<LocalSearchItem[]>;
  searchLocal: (
    query: string,
    scopePath?: string | null,
    intent?: SearchIntent | null,
    requestId?: string
  ) => Promise<LocalSearchItem[]>;
  getStatus: (requestId?: string) => Promise<LauncherStatus>;
  getSettings: () => Promise<LauncherSettings>;
  getEffectiveShortcut?: () => Promise<string>;
  saveSettings: (settings: LauncherSettings) => Promise<LauncherSettings>;
  getSearchPerformance?: () => Promise<{
    samples: SearchPerformanceSample[];
    summary: SearchPerformanceSummary;
  }>;
  recordSearchPerformance?: (sample: Omit<SearchPerformanceSample, 'id' | 'recordedAt'>) => Promise<void>;
  getScopeInsights?: () => Promise<ScopePerformanceInsight[]>;
  getClipboardHistory: () => Promise<ClipboardEntry[]>;
  openSettings: () => Promise<void>;
  openSystemSettings?: (url: string) => Promise<void>;
  getPathPreview: (path: string, kind: LocalSearchItem['kind'], requestId?: string) => Promise<LauncherPreview | null>;
  getPathIcon: (path: string, requestId?: string) => Promise<string | null>;
  getPathIcons?: (paths: string[], requestId?: string) => Promise<Record<string, string | null>>;
  getTraceState?: () => Promise<LauncherTraceState>;
  setTraceEnabled?: (enabled: boolean) => Promise<LauncherTraceState>;
  traceEvent?: (event: LauncherTraceEvent) => Promise<void>;
  getTraceDump?: () => Promise<LauncherTraceDump>;
  getIdleTraceSummary?: () => Promise<LauncherTraceIdleSummary>;
  writeTraceDump?: () => Promise<LauncherTraceDumpFile>;
  recordLocalSelection?: (item: Pick<LocalSearchItem, 'path' | 'name' | 'kind'>) => Promise<void>;
  quickLookPath: (path: string) => Promise<void>;
  onSettingsChanged?: (callback: (settings: LauncherSettings) => void) => () => void;
  onIndexChanged?: (callback: () => void) => () => void;
  onVisibilityChanged?: (callback: (visible: boolean) => void) => () => void;
  openPath: (path: string) => Promise<void>;
  revealPath: (path: string) => Promise<void>;
  openInTerminal: (path: string) => Promise<void>;
  openWithTextEdit: (path: string) => Promise<void>;
  hide: () => Promise<void>;
  ready: () => Promise<void>;
};
