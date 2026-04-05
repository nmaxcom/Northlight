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
        launcherCurrentView: resolve(__dirname, 'design/launcher-current-view.html'),
        launcherCurrentViewFrame: resolve(__dirname, 'design/launcher-current-view-frame.html'),
        settingsCurrentView: resolve(__dirname, 'design/settings-current-view.html'),
        settingsCurrentViewFrame: resolve(__dirname, 'design/settings-current-view-frame.html')
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
