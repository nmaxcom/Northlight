import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  define: {
    global: 'globalThis'
  },
  plugins: [react()],
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
