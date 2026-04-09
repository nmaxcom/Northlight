import type { Plugin } from 'vite';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const DEVTOOLS_WORKSPACE_UUID = '7f4f8b6e-0f85-4c4d-a171-2e39b4b6d7a5';

function devtoolsWorkspacePlugin(): Plugin {
  return {
    name: 'northlight-devtools-workspace',
    configureServer(server) {
      server.middlewares.use('/.well-known/appspecific/com.chrome.devtools.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            workspace: {
              root: resolve(__dirname),
              uuid: DEVTOOLS_WORKSPACE_UUID
            }
          })
        );
      });
    }
  };
}

export default defineConfig({
  define: {
    global: 'globalThis'
  },
  plugins: [react(), devtoolsWorkspacePlugin()],
  build: {
    rollupOptions: {
      input: {
        app: resolve(__dirname, 'index.html'),
        designIndex: resolve(__dirname, 'design/index.html'),
        launcherCurrentViewLive: resolve(__dirname, 'design/launcher-current-view.live.html'),
        launcherCurrentView: resolve(__dirname, 'design/launcher-current-view.html'),
        launcherFolderPreviewLive: resolve(__dirname, 'design/launcher-folder-preview.live.html'),
        launcherFolderPreview: resolve(__dirname, 'design/launcher-folder-preview.html'),
        launcherAppPreviewLive: resolve(__dirname, 'design/launcher-app-preview.live.html'),
        launcherAppPreview: resolve(__dirname, 'design/launcher-app-preview.html'),
        launcherFolderListingPreviewLive: resolve(__dirname, 'design/launcher-folder-listing-preview.live.html'),
        launcherFolderListingPreview: resolve(__dirname, 'design/launcher-folder-listing-preview.html'),
        launcherFilePreviewLive: resolve(__dirname, 'design/launcher-file-preview.live.html'),
        launcherFilePreview: resolve(__dirname, 'design/launcher-file-preview.html'),
        settingsCurrentViewLive: resolve(__dirname, 'design/settings-current-view.live.html'),
        settingsCurrentView: resolve(__dirname, 'design/settings-current-view.html')
      }
    }
  },
  test: {
    exclude: ['tests/e2e/**', 'node_modules/**'],
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts'
  }
});
