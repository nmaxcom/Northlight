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
  searchLocal: (query: string, scopePath?: string | null) => Promise<LocalSearchItem[]>;
  getStatus: () => Promise<LauncherStatus>;
  getSettings: () => Promise<LauncherSettings>;
  getEffectiveShortcut?: () => Promise<string>;
  saveSettings: (settings: LauncherSettings) => Promise<LauncherSettings>;
  getClipboardHistory: () => Promise<ClipboardEntry[]>;
  openSettings: () => Promise<void>;
  getPathPreview: (path: string, kind: LocalSearchItem['kind']) => Promise<LauncherPreview | null>;
  getPathIcon: (path: string) => Promise<string | null>;
  getPathIcons?: (paths: string[]) => Promise<Record<string, string | null>>;
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
