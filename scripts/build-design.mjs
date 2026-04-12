import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import react from '@vitejs/plugin-react';
import { build } from 'vite';

const root = resolve('.');
const outDir = resolve('design/assets/bundles');

const targets = [
  {
    name: 'launcher-current-view',
    entry: resolve('src/design/launcher-current-view.tsx')
  },
  {
    name: 'settings-current-view',
    entry: resolve('src/design/settings-current-view.tsx')
  }
];

async function buildTarget(target, emptyOutDir) {
  await build({
    configFile: false,
    root,
    publicDir: false,
    define: {
      global: 'globalThis',
      'process.env.NODE_ENV': '"production"'
    },
    plugins: [react()],
    build: {
      outDir,
      emptyOutDir,
      sourcemap: true,
      minify: false,
      cssCodeSplit: false,
      lib: {
        entry: target.entry,
        formats: ['iife'],
        name: target.name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()).replace(/^[a-z]/, (letter) => letter.toUpperCase()),
        fileName: () => `${target.name}.js`
      },
      rollupOptions: {
        output: {
          chunkFileNames: `${target.name}-[name].js`,
          assetFileNames: (assetInfo) => {
            if (assetInfo.name?.endsWith('.css')) {
              return `${target.name}.css`;
            }

            return `${target.name}-[name][extname]`;
          }
        }
      }
    }
  });
}

export async function buildDesignBundles() {
  await mkdir(outDir, { recursive: true });
  let first = true;
  for (const target of targets) {
    await buildTarget(target, first);
    first = false;
  }
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : null;
if (entryHref === import.meta.url) {
  await buildDesignBundles();
}
