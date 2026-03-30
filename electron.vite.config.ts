import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new globalThis.URL('.', import.meta.url));

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: resolve(rootDir, 'electron/main.ts')
      },
      outDir: 'dist-electron/main'
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    define: {
      global: 'globalThis'
    },
    build: {
      rollupOptions: {
        output: {
          format: 'cjs',
          entryFileNames: 'preload.js'
        }
      },
      lib: {
        entry: resolve(rootDir, 'electron/preload.ts')
      },
      outDir: 'dist-electron/preload'
    }
  },
  renderer: {
    root: '.',
    define: {
      global: 'globalThis'
    },
    plugins: [react()],
    build: {
      rollupOptions: {
        input: resolve(rootDir, 'index.html')
      }
    }
  }
});
