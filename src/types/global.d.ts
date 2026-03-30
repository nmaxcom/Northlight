import type { LauncherBridge } from '../lib/search/types';

export {};

declare global {
  interface Window {
    launcher?: LauncherBridge;
  }
}
