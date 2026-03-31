import { contextBridge, ipcRenderer } from 'electron';
import type { LauncherSettings } from '../src/lib/search/types';

const launcherApi = {
  searchLocal: (query: string, scopePath?: string | null) => ipcRenderer.invoke('launcher:search-local', query, scopePath),
  getStatus: () => ipcRenderer.invoke('launcher:get-status'),
  getSettings: () => ipcRenderer.invoke('launcher:get-settings'),
  getEffectiveShortcut: () => ipcRenderer.invoke('launcher:get-effective-shortcut'),
  saveSettings: (settings: LauncherSettings) => ipcRenderer.invoke('launcher:save-settings', settings),
  getClipboardHistory: () => ipcRenderer.invoke('launcher:get-clipboard-history'),
  openSettings: () => ipcRenderer.invoke('launcher:open-settings'),
  getPathPreview: (path: string, kind: 'file' | 'folder' | 'app') => ipcRenderer.invoke('launcher:get-path-preview', path, kind),
  getPathIcon: (path: string) => ipcRenderer.invoke('launcher:get-path-icon', path),
  getPathIcons: (paths: string[]) => ipcRenderer.invoke('launcher:get-path-icons', paths),
  quickLookPath: (path: string) => ipcRenderer.invoke('launcher:quick-look-path', path),
  openPath: (path: string) => ipcRenderer.invoke('launcher:open-path', path),
  revealPath: (path: string) => ipcRenderer.invoke('launcher:reveal-path', path),
  openInTerminal: (path: string) => ipcRenderer.invoke('launcher:open-in-terminal', path),
  openWithTextEdit: (path: string) => ipcRenderer.invoke('launcher:open-with-text-edit', path),
  trashPath: (path: string) => ipcRenderer.invoke('launcher:trash-path', path),
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
  }
};

contextBridge.exposeInMainWorld('launcher', launcherApi);
