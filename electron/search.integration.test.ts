import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const actualUserDataPath = join(process.env.HOME ?? '', 'Library', 'Application Support', 'Northlight');
const representativeApps = [
  { query: 'calendar', path: '/System/Applications/Calendar.app' },
  { query: 'textedit', path: '/System/Applications/TextEdit.app' },
  { query: 'preview', path: '/System/Applications/Preview.app' },
  { query: 'notes', path: '/System/Applications/Notes.app' },
  { query: 'safari', path: '/System/Applications/Safari.app' },
  { query: 'system settings', path: '/System/Applications/System Settings.app' }
] as const;

async function copyIfPresent(filename: string, targetDir: string) {
  const sourcePath = join(actualUserDataPath, filename);
  const contents = await readFile(sourcePath, 'utf8');
  await writeFile(join(targetDir, filename), contents, 'utf8');
}

async function createIsolatedUserData() {
  const tempUserData = await mkdtemp(join(tmpdir(), 'northlight-search-it-'));
  await copyIfPresent('launcher-state.json', tempUserData);
  await copyIfPresent('local-search-catalog.json', tempUserData);
  return tempUserData;
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, 'utf8')) as T;
}

describe('main-process search integration', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('recalls representative macOS apps from the copied persisted catalog in hot and deep search', async () => {
    if (process.platform !== 'darwin') {
      return;
    }

    const tempUserData = await createIsolatedUserData();
    const copiedCatalog = await readJson<{ entries: Array<{ path: string; name: string }> }>(join(tempUserData, 'local-search-catalog.json'));
    const copiedPaths = new Set(copiedCatalog.entries.map((entry) => entry.path));

    const presentRepresentativeApps = representativeApps.filter((app) => copiedPaths.has(app.path));
    expect(presentRepresentativeApps.length).toBeGreaterThanOrEqual(5);

    vi.doMock('electron', () => ({
      app: {
        getPath: (name: string) => {
          if (name === 'userData') {
            return tempUserData;
          }

          throw new Error(`Unexpected app.getPath(${name})`);
        }
      },
      clipboard: {
        readText: () => ''
      }
    }));

    const { searchHotPaths, searchIndexedPaths, getSearchStatus } = await import('./search');

    for (const app of presentRepresentativeApps) {
      const hotResults = await searchHotPaths(app.query);
      const scopedHotResults = await searchHotPaths(app.query, '/System/Applications');
      const deepResults = await searchIndexedPaths(app.query);

      expect(hotResults[0]?.path).toBe(app.path);
      expect(scopedHotResults[0]?.path).toBe(app.path);
      expect(deepResults[0]?.path).toBe(app.path);
    }

    const status = getSearchStatus('0.0.0');
    expect(status.indexReady).toBe(true);
    expect(status.indexEntryCount).toBeGreaterThan(0);
  });

  it('honors persisted application scopes from launcher state', async () => {
    if (process.platform !== 'darwin') {
      return;
    }

    const tempUserData = await createIsolatedUserData();
    const statePath = join(tempUserData, 'launcher-state.json');
    const copiedState = await readJson<{
      settings: { scopes: Array<{ id: string; path: string; enabled: boolean; hot?: boolean }> };
    }>(statePath);

    copiedState.settings.scopes = copiedState.settings.scopes.map((scope) =>
      scope.path === '/System/Applications' ? { ...scope, enabled: false, hot: false } : scope
    );
    await writeFile(statePath, JSON.stringify(copiedState, null, 2), 'utf8');

    vi.doMock('electron', () => ({
      app: {
        getPath: (name: string) => {
          if (name === 'userData') {
            return tempUserData;
          }

          throw new Error(`Unexpected app.getPath(${name})`);
        }
      },
      clipboard: {
        readText: () => ''
      }
    }));

    const { searchHotPaths } = await import('./search');
    const hotResults = await searchHotPaths('calendar');

    expect(hotResults.some((result) => result.path === '/System/Applications/Calendar.app')).toBe(false);
  });
});
