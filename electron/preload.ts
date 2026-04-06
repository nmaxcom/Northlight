import { contextBridge, ipcRenderer } from 'electron';
import type { LauncherSettings, LauncherTraceEvent, LocalSearchItem, SearchIntent } from '../src/lib/search/types';

const launcherApi = {
  searchLocalHot: (
    query: string,
    scopePath?: string | null,
    intent?: SearchIntent | null,
    requestId?: string
  ) => ipcRenderer.invoke('launcher:search-local-hot', query, scopePath, intent, requestId),
  searchLocal: (
    query: string,
    scopePath?: string | null,
    intent?: SearchIntent | null,
    requestId?: string
  ) => ipcRenderer.invoke('launcher:search-local', query, scopePath, intent, requestId),
  getStatus: (requestId?: string) => ipcRenderer.invoke('launcher:get-status', requestId),
  getSettings: () => ipcRenderer.invoke('launcher:get-settings'),
  getEffectiveShortcut: () => ipcRenderer.invoke('launcher:get-effective-shortcut'),
  saveSettings: (settings: LauncherSettings) => ipcRenderer.invoke('launcher:save-settings', settings),
  getClipboardHistory: () => ipcRenderer.invoke('launcher:get-clipboard-history'),
  openSettings: () => ipcRenderer.invoke('launcher:open-settings'),
  openSystemSettings: (url: string) => ipcRenderer.invoke('launcher:open-system-settings', url),
  getPathPreview: (path: string, kind: 'file' | 'folder' | 'app', requestId?: string) =>
    ipcRenderer.invoke('launcher:get-path-preview', path, kind, requestId),
  getPathIcon: (path: string, requestId?: string) => ipcRenderer.invoke('launcher:get-path-icon', path, requestId),
  getPathIcons: (paths: string[], requestId?: string) => ipcRenderer.invoke('launcher:get-path-icons', paths, requestId),
  getTraceState: () => ipcRenderer.invoke('launcher:get-trace-state'),
  setTraceEnabled: (enabled: boolean) => ipcRenderer.invoke('launcher:set-trace-enabled', enabled),
  traceEvent: (event: LauncherTraceEvent) => ipcRenderer.invoke('launcher:trace-event', event),
  getTraceDump: () => ipcRenderer.invoke('launcher:get-trace-dump'),
  getIdleTraceSummary: () => ipcRenderer.invoke('launcher:get-idle-trace-summary'),
  writeTraceDump: () => ipcRenderer.invoke('launcher:write-trace-dump'),
  recordLocalSelection: (item: Pick<LocalSearchItem, 'path' | 'name' | 'kind'>) => ipcRenderer.invoke('launcher:record-local-selection', item),
  quickLookPath: (path: string) => ipcRenderer.invoke('launcher:quick-look-path', path),
  openPath: (path: string) => ipcRenderer.invoke('launcher:open-path', path),
  revealPath: (path: string) => ipcRenderer.invoke('launcher:reveal-path', path),
  openInTerminal: (path: string) => ipcRenderer.invoke('launcher:open-in-terminal', path),
  openWithTextEdit: (path: string) => ipcRenderer.invoke('launcher:open-with-text-edit', path),
  hide: () => ipcRenderer.invoke('launcher:hide'),
  ready: () => ipcRenderer.invoke('launcher:ready'),
  onSettingsChanged: (callback: (settings: LauncherSettings) => void) => {
    const listener = (_event: unknown, settings: LauncherSettings) => callback(settings);
    ipcRenderer.on('launcher:settings-changed', listener);
    return () => ipcRenderer.removeListener('launcher:settings-changed', listener);
  },
  onIndexChanged: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('launcher:index-changed', listener);
    return () => ipcRenderer.removeListener('launcher:index-changed', listener);
  },
  onVisibilityChanged: (callback: (visible: boolean) => void) => {
    const listener = (_event: unknown, visible: boolean) => callback(visible);
    ipcRenderer.on('launcher:visibility-changed', listener);
    return () => ipcRenderer.removeListener('launcher:visibility-changed', listener);
  }
};

contextBridge.exposeInMainWorld('launcher', launcherApi);
